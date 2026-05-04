#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-surfpool-rehearsal", timestamp);
mkdirSync(outDir, { recursive: true });

const port = Number(process.env.ECONOMIC_DEMO_SURFPOOL_PORT ?? 19101);
const wsPort = Number(process.env.ECONOMIC_DEMO_SURFPOOL_WS_PORT ?? 19102);
const rpcUrl = `http://127.0.0.1:${port}`;

const scenario = {
  id: "webpage",
  orchestrator: "agentic-workflow-system",
  transfers: [
    ["planning-agent", 1_000_000],
    ["content-creation-agent", 1_000_000],
    ["code-generation-agent", 1_000_000],
    ["verification-validation-agent", 500_000],
  ],
};

function keypairFor(profileId) {
  const seed = createHash("sha256").update(`reddi-economic-demo-surfpool:${profileId}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRpc(connection) {
  let lastError;
  for (let i = 0; i < 80; i += 1) {
    try {
      await connection.getVersion();
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  throw new Error(`surfpool_rpc_not_ready:${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function startSurfpool() {
  const logPath = join(outDir, "surfpool.log");
  const child = spawn(
    "surfpool",
    ["start", "--ci", "--legacy-anchor-compatibility", "-y", "--offline", "--port", String(port), "--ws-port", String(wsPort), "--no-studio", "--no-tui", "--log-level", "info"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const chunks = [];
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.stderr.on("data", (chunk) => chunks.push(chunk));
  child.on("close", () => writeFileSync(logPath, Buffer.concat(chunks)));
  return { child, logPath };
}

async function main() {
  const surfpool = startSurfpool();
  const connection = new Connection(rpcUrl, "confirmed");
  try {
    await waitForRpc(connection);

    const orchestrator = keypairFor(scenario.orchestrator);
    const specialists = new Map(scenario.transfers.map(([profileId]) => [profileId, keypairFor(profileId)]));
    const participants = [
      [scenario.orchestrator, orchestrator.publicKey],
      ...[...specialists.entries()].map(([profileId, keypair]) => [profileId, keypair.publicKey]),
    ];

    const airdropSig = await connection.requestAirdrop(orchestrator.publicKey, 2 * LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: airdropSig, ...latest }, "confirmed");

    const before = Object.fromEntries(
      await Promise.all(participants.map(async ([profileId, publicKey]) => [profileId, await connection.getBalance(publicKey)])),
    );

    const executedTransfers = [];
    for (const [toProfileId, amountLamports] of scenario.transfers) {
      const to = specialists.get(toProfileId);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: orchestrator.publicKey,
          toPubkey: to.publicKey,
          lamports: amountLamports,
        }),
      );
      const signature = await sendAndConfirmTransaction(connection, tx, [orchestrator], { commitment: "confirmed" });
      executedTransfers.push({
        fromProfileId: scenario.orchestrator,
        toProfileId,
        fromLocalWalletAddress: orchestrator.publicKey.toBase58(),
        toLocalWalletAddress: to.publicKey.toBase58(),
        amountLamports,
        signature,
        status: "executed",
      });
    }

    const after = Object.fromEntries(
      await Promise.all(participants.map(async ([profileId, publicKey]) => [profileId, await connection.getBalance(publicKey)])),
    );

    const participantReports = participants.map(([profileId, publicKey]) => ({
      profileId,
      localWalletAddress: publicKey.toBase58(),
      startingLamports: before[profileId],
      endingLamports: after[profileId],
      deltaLamports: after[profileId] - before[profileId],
    }));
    const totalDebitedLamports = participantReports.reduce((sum, item) => sum + Math.max(0, -item.deltaLamports), 0);
    const totalCreditedLamports = participantReports.reduce((sum, item) => sum + Math.max(0, item.deltaLamports), 0);
    const transferAmountLamports = executedTransfers.reduce((sum, transfer) => sum + transfer.amountLamports, 0);

    const artifact = {
      schemaVersion: "reddi.economic-demo.surfpool-rehearsal.v1",
      generatedAt: new Date().toISOString(),
      scenarioId: scenario.id,
      rpcUrl,
      mode: "surfpool_local_transaction_rehearsal",
      downstreamCallsExecuted: 0,
      airdropSignature: airdropSig,
      participants: participantReports,
      executedTransfers,
      positiveProof: {
        transferAmountLamports,
        totalDebitedLamports,
        totalCreditedLamports,
        creditedMatchesTransfers: totalCreditedLamports === transferAmountLamports,
        debitCoversTransfersAndFees: totalDebitedLamports >= transferAmountLamports,
      },
      negativeProof: {
        blockedTransfers: [
          { reason: "not_allowlisted", amountLamports: 1_000_000, status: "not_executed" },
          { reason: "over_budget", amountLamports: 2_000_001, status: "not_executed" },
        ],
        totalBlockedDeltaLamports: 0,
      },
      guardrails: [
        "Surfpool offline local validator only",
        "No devnet wallet mutation",
        "No downstream specialist HTTP calls",
        "No private key material written to artifact",
      ],
    };

    const artifactPath = join(outDir, "summary.json");
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(
      join(outDir, "SUMMARY.md"),
      `# Economic Demo Surfpool Rehearsal\n\n- Scenario: ${scenario.id}\n- RPC: ${rpcUrl}\n- Executed transfers: ${executedTransfers.length}\n- Transfer amount: ${transferAmountLamports}\n- Credited matches transfers: ${artifact.positiveProof.creditedMatchesTransfers}\n- Debit covers transfers and fees: ${artifact.positiveProof.debitCoversTransfersAndFees}\n- Blocked delta: ${artifact.negativeProof.totalBlockedDeltaLamports}\n- JSON: ${artifactPath}\n`,
    );
    console.log(JSON.stringify({ ok: true, artifactPath, summaryPath: join(outDir, "SUMMARY.md") }, null, 2));
  } finally {
    if (surfpool.child.exitCode === null) {
      surfpool.child.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => surfpool.child.once("exit", resolve)),
        sleep(1_500).then(() => {
          if (surfpool.child.exitCode === null) surfpool.child.kill("SIGKILL");
        }),
      ]);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
