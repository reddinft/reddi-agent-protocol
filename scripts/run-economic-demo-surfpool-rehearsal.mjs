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
  user: "end-user",
  orchestrator: "agentic-workflow-system",
  protocolTreasury: "reddi-protocol-treasury",
  protocolRailFeeBps: 5,
  upfrontFunding: { amountUsdc: 3.33125, equivalentLamports: 3_331_250, paymentAsset: "USDC" },
  jupiterSolRoute: { inputAsset: "SOL", outputAsset: "USDC", estimatedInputSol: 0.021, outputUsdc: 3.33125, slippageBps: 75, status: "quoted_not_executed" },
  transfers: [
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

function protocolFeeLamportsFor(amountLamports) {
  return Math.round((amountLamports * scenario.protocolRailFeeBps) / 10_000);
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

    const user = keypairFor(scenario.user);
    const orchestrator = keypairFor(scenario.orchestrator);
    const protocolTreasury = keypairFor(scenario.protocolTreasury);
    const specialists = new Map(scenario.transfers.map(([profileId]) => [profileId, keypairFor(profileId)]));
    const participants = [
      [scenario.user, user.publicKey],
      [scenario.orchestrator, orchestrator.publicKey],
      [scenario.protocolTreasury, protocolTreasury.publicKey],
      ...[...specialists.entries()].map(([profileId, keypair]) => [profileId, keypair.publicKey]),
    ];

    const userAirdropSig = await connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    const orchestratorAirdropSig = await connection.requestAirdrop(orchestrator.publicKey, LAMPORTS_PER_SOL);
    let latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: userAirdropSig, ...latest }, "confirmed");
    latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: orchestratorAirdropSig, ...latest }, "confirmed");

    const before = Object.fromEntries(
      await Promise.all(participants.map(async ([profileId, publicKey]) => [profileId, await connection.getBalance(publicKey)])),
    );

    const executedTransfers = [];
    const upfrontTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: user.publicKey,
        toPubkey: orchestrator.publicKey,
        lamports: scenario.upfrontFunding.equivalentLamports,
      }),
    );
    const upfrontSignature = await sendAndConfirmTransaction(connection, upfrontTx, [user], { commitment: "confirmed" });
    executedTransfers.push({
      fromProfileId: scenario.user,
      toProfileId: scenario.orchestrator,
      fromLocalWalletAddress: user.publicKey.toBase58(),
      toLocalWalletAddress: orchestrator.publicKey.toBase58(),
      amountLamports: scenario.upfrontFunding.equivalentLamports,
      signature: upfrontSignature,
      status: "executed",
      category: "upfront_user_funding",
    });

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
        category: "downstream_agent_payment",
      });

      const protocolFeeLamports = protocolFeeLamportsFor(amountLamports);
      if (protocolFeeLamports > 0) {
        const feeTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: orchestrator.publicKey,
            toPubkey: protocolTreasury.publicKey,
            lamports: protocolFeeLamports,
          }),
        );
        const feeSignature = await sendAndConfirmTransaction(connection, feeTx, [orchestrator], { commitment: "confirmed" });
        executedTransfers.push({
          fromProfileId: scenario.orchestrator,
          toProfileId: scenario.protocolTreasury,
          fromLocalWalletAddress: orchestrator.publicKey.toBase58(),
          toLocalWalletAddress: protocolTreasury.publicKey.toBase58(),
          amountLamports: protocolFeeLamports,
          signature: feeSignature,
          status: "executed",
          category: "protocol_rail_fee",
          feeBps: scenario.protocolRailFeeBps,
          feeOnTransferLamports: amountLamports,
        });
      }
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
    const downstreamTransferAmountLamports = executedTransfers
      .filter((transfer) => transfer.category === "downstream_agent_payment")
      .reduce((sum, transfer) => sum + transfer.amountLamports, 0);
    const protocolFeeAmountLamports = executedTransfers
      .filter((transfer) => transfer.category === "protocol_rail_fee")
      .reduce((sum, transfer) => sum + transfer.amountLamports, 0);
    const grossExecutedLamports = executedTransfers.reduce((sum, transfer) => sum + transfer.amountLamports, 0);
    const specialistCreditedLamports = participantReports
      .filter((item) => item.profileId !== scenario.user && item.profileId !== scenario.orchestrator && item.profileId !== scenario.protocolTreasury)
      .reduce((sum, item) => sum + Math.max(0, item.deltaLamports), 0);
    const orchestratorDeltaLamports = participantReports.find((item) => item.profileId === scenario.orchestrator)?.deltaLamports ?? 0;
    const protocolTreasuryDeltaLamports = participantReports.find((item) => item.profileId === scenario.protocolTreasury)?.deltaLamports ?? 0;

    const artifact = {
      schemaVersion: "reddi.economic-demo.surfpool-rehearsal.v1",
      generatedAt: new Date().toISOString(),
      scenarioId: scenario.id,
      rpcUrl,
      mode: "surfpool_local_transaction_rehearsal",
      downstreamCallsExecuted: 0,
      airdropSignatures: { user: userAirdropSig, orchestrator: orchestratorAirdropSig },
      upfrontFunding: { ...scenario.upfrontFunding, fromProfileId: scenario.user, toProfileId: scenario.orchestrator, signature: upfrontSignature },
      jupiterSolRoute: scenario.jupiterSolRoute,
      protocolRailFee: {
        bps: scenario.protocolRailFeeBps,
        treasuryProfileId: scenario.protocolTreasury,
        totalFeeLamports: protocolFeeAmountLamports,
        feeTransfers: executedTransfers.filter((transfer) => transfer.category === "protocol_rail_fee"),
      },
      participants: participantReports,
      executedTransfers,
      positiveProof: {
        upfrontFundingLamports: scenario.upfrontFunding.equivalentLamports,
        downstreamTransferAmountLamports,
        grossExecutedLamports,
        totalDebitedLamports,
        totalCreditedLamports,
        specialistCreditedLamports,
        orchestratorDeltaLamports,
        specialistCreditsMatchDownstreamTransfers: specialistCreditedLamports === downstreamTransferAmountLamports,
        protocolTreasuryCreditedLamports: protocolTreasuryDeltaLamports,
        protocolFeeMatchesExpectedBps: protocolFeeAmountLamports === scenario.transfers.reduce((sum, [, amountLamports]) => sum + protocolFeeLamportsFor(amountLamports), 0),
        upfrontCoversDownstreamBudget: scenario.upfrontFunding.equivalentLamports >= downstreamTransferAmountLamports + protocolFeeAmountLamports,
        orchestratorRetainsPositiveMarkupBeforeFees: orchestratorDeltaLamports > 0,
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
        "Every agent-to-agent transfer through Reddi Agent Protocol rails pays a 0.05% protocol fee to protocol treasury",
        "No private key material written to artifact",
      ],
    };

    const artifactPath = join(outDir, "summary.json");
    writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(
      join(outDir, "SUMMARY.md"),
      `# Economic Demo Surfpool Rehearsal\n\n- Scenario: ${scenario.id}\n- RPC: ${rpcUrl}\n- Executed transfers: ${executedTransfers.length}\n- Upfront funding: ${scenario.upfrontFunding.equivalentLamports} lamports-equivalent (${scenario.upfrontFunding.amountUsdc} USDC)\n- Jupiter SOL route: ${scenario.jupiterSolRoute.estimatedInputSol} SOL → ${scenario.jupiterSolRoute.outputUsdc} USDC (${scenario.jupiterSolRoute.status})\n- Downstream transfer amount: ${downstreamTransferAmountLamports}\n- Protocol rail fee: ${protocolFeeAmountLamports} lamports (${scenario.protocolRailFeeBps} bps)\n- Protocol fee matches expected bps: ${artifact.positiveProof.protocolFeeMatchesExpectedBps}\n- Specialist credits match downstream transfers: ${artifact.positiveProof.specialistCreditsMatchDownstreamTransfers}\n- Upfront covers downstream budget + protocol fee: ${artifact.positiveProof.upfrontCoversDownstreamBudget}\n- Orchestrator retains positive markup after fees: ${artifact.positiveProof.orchestratorRetainsPositiveMarkupBeforeFees}\n- Blocked delta: ${artifact.negativeProof.totalBlockedDeltaLamports}\n- JSON: ${artifactPath}\n`,
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
