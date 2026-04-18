import "server-only";

import { createHash, randomUUID } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { SwapClient } from "@reddi/x402-solana";
import { routePlannerPolicy, type PlannerPolicyInput } from "@/lib/onboarding/planner-router";
import { processX402Challenge } from "@/lib/onboarding/x402-settlement";
import { emitTorqueEvent } from "@/lib/torque/client";
import { TORQUE_EVENTS } from "@/lib/torque/events";

export type PlannerExecuteInput = {
  prompt: string;
  policy?: PlannerPolicyInput;
  swapClient?: SwapClient;
  slippageBps?: number;
};

export type PlannerRunRecord = {
  runId: string;
  createdAt: string;
  selectedWallet?: string;
  endpointUrl?: string;
  policy: PlannerPolicyInput;
  promptSha256: string;
  status: "completed" | "failed";
  challengeSeen: boolean;
  paymentAttempted: boolean;
  paymentSatisfied: boolean;
  x402TxSignature?: string;
  x402ReceiptNonce?: string;
  reputationCommitTx?: string;
  responseStatus?: number;
  responsePreview?: string;
  error?: string;
  trace: string[];
};

const RUNS_PATH = join(process.cwd(), "data", "onboarding", "planner-runs.json");

function readRuns(): PlannerRunRecord[] {
  try {
    return JSON.parse(readFileSync(RUNS_PATH, "utf8")) as PlannerRunRecord[];
  } catch {
    return [];
  }
}

function writeRuns(records: PlannerRunRecord[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(RUNS_PATH, JSON.stringify(records, null, 2));
}

function appendRun(run: PlannerRunRecord) {
  const records = readRuns();
  records.push(run);
  writeRuns(records);
}

function endpointPath(endpointUrl: string, path: string) {
  return `${endpointUrl.replace(/\/$/, "")}${path}`;
}

function previewText(body: unknown) {
  if (typeof body === "string") return body.slice(0, 300);
  try {
    return JSON.stringify(body).slice(0, 300);
  } catch {
    return "";
  }
}

export async function executePlannerSpecialistCall(input: PlannerExecuteInput) {
  if (!input.prompt || input.prompt.trim().length < 3) {
    throw new Error("Prompt is required.");
  }

  const policy: PlannerPolicyInput = {
    requiresHealthPass: true,
    ...input.policy,
  };

  const runId = `run_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const promptSha256 = createHash("sha256").update(input.prompt).digest("hex");
  const trace: string[] = [];

  const routed = routePlannerPolicy(policy);
  if (!routed.selected || !routed.selected.endpointUrl) {
    const failed: PlannerRunRecord = {
      runId,
      createdAt,
      policy,
      promptSha256,
      status: "failed",
      challengeSeen: false,
      paymentAttempted: false,
      paymentSatisfied: false,
      error: "No eligible specialist candidate found.",
      trace: ["planner: no eligible candidate"],
    };
    appendRun(failed);
    return {
      ok: false,
      result: failed,
      candidates: routed.candidates,
      rejected: routed.rejected,
    };
  }

  const endpointUrl = routed.selected.endpointUrl;
  const payload = {
    model: "ollama-local",
    messages: [{ role: "user", content: input.prompt }],
    stream: false,
  };

  trace.push(`planner:selected:${routed.selected.walletAddress}`);
  trace.push(`request:start:${endpointPath(endpointUrl, "/v1/chat/completions")}`);

  try {
    const first = await fetch(endpointPath(endpointUrl, "/v1/chat/completions"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const firstBody = await first.text();

    if (first.status === 402) {
      trace.push("x402:challenge_received");

      // Collect response headers from the 402 challenge
      const challengeHeaders: Record<string, string> = {};
      first.headers.forEach((v, k) => { challengeHeaders[k] = v; });

      // Process the x402 challenge — parse header, build payment receipt
      const settlement = await processX402Challenge(
        challengeHeaders,
        routed.selected.walletAddress,
        {
          swapClient: input.swapClient,
          slippageBps: input.slippageBps,
        }
      );

      if (!settlement.ok) {
        const run: PlannerRunRecord = {
          runId, createdAt,
          selectedWallet: routed.selected.walletAddress,
          endpointUrl, policy, promptSha256,
          status: "failed",
          challengeSeen: true,
          paymentAttempted: false,
          paymentSatisfied: false,
          error: settlement.error,
          trace: [...trace, ...settlement.trace, "planner:failed"],
        };
        appendRun(run);
        return { ok: false, result: run, candidates: routed.candidates };
      }

      trace.push(...settlement.trace);

      // Retry with the real x402-payment receipt header
      const second = await fetch(endpointPath(endpointUrl, "/v1/chat/completions"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x402-payment": settlement.receiptHeader,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });

      const secondText = await second.text();
      const run: PlannerRunRecord = {
        runId,
        createdAt,
        selectedWallet: routed.selected.walletAddress,
        endpointUrl,
        policy,
        promptSha256,
        status: second.ok ? "completed" : "failed",
        challengeSeen: true,
        paymentAttempted: true,
        paymentSatisfied: second.ok,
        x402TxSignature: settlement.receipt.txSignature,
        x402ReceiptNonce: settlement.receipt.nonce,
        responseStatus: second.status,
        responsePreview: previewText(secondText),
        error: second.ok ? undefined : `Specialist call failed after x402 payment (${second.status}).`,
        trace: [
          ...trace,
          `retry:status:${second.status}`,
          second.ok ? "planner:completed" : "planner:failed",
        ],
      };
      appendRun(run);

      if (second.ok) {
        void emitTorqueEvent({
          userPubkey: "unknown",
          eventName: TORQUE_EVENTS.CONSUMER_QUERY_RUN,
          fields: {
            taskType: "planner_query",
            specialistWallet: routed.selected.walletAddress,
            success: true,
          },
        });
      }

      return {
        ok: second.ok,
        result: run,
        response: secondText,
        candidates: routed.candidates,
      };
    }

    const run: PlannerRunRecord = {
      runId,
      createdAt,
      selectedWallet: routed.selected.walletAddress,
      endpointUrl,
      policy,
      promptSha256,
      status: first.ok ? "completed" : "failed",
      challengeSeen: false,
      paymentAttempted: false,
      paymentSatisfied: false,
      responseStatus: first.status,
      responsePreview: previewText(firstBody),
      error: first.ok ? undefined : `Specialist call failed (${first.status}).`,
      trace: [...trace, `response:status:${first.status}`, first.ok ? "planner:completed" : "planner:failed"],
    };

    appendRun(run);

    if (first.ok) {
      void emitTorqueEvent({
        userPubkey: "unknown",
        eventName: TORQUE_EVENTS.CONSUMER_QUERY_RUN,
        fields: {
          taskType: "planner_query",
          specialistWallet: routed.selected.walletAddress,
          success: true,
        },
      });
    }

    return {
      ok: first.ok,
      result: run,
      response: firstBody,
      candidates: routed.candidates,
    };
  } catch (error) {
    const run: PlannerRunRecord = {
      runId,
      createdAt,
      selectedWallet: routed.selected.walletAddress,
      endpointUrl,
      policy,
      promptSha256,
      status: "failed",
      challengeSeen: false,
      paymentAttempted: false,
      paymentSatisfied: false,
      error: error instanceof Error ? error.message : "Planner execution failed",
      trace: [...trace, "planner:exception"],
    };
    appendRun(run);
    return {
      ok: false,
      result: run,
      candidates: routed.candidates,
    };
  }
}

export function listPlannerRuns() {
  return {
    ok: true,
    results: readRuns(),
    storagePath: RUNS_PATH,
  };
}
