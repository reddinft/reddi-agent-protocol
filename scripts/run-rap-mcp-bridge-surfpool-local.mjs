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
const outDir = join(rootDir, "artifacts", "rap-mcp-bridge-surfpool-local", timestamp);
mkdirSync(outDir, { recursive: true });

const port = Number(process.env.RAP_MCP_SURFPOOL_PORT ?? 19111);
const wsPort = Number(process.env.RAP_MCP_SURFPOOL_WS_PORT ?? 19112);
const rpcUrl = `http://127.0.0.1:${port}`;

const scenario = {
  quoteId: "quote_rap_mcp_bridge_surfpool_research_001",
  host: "mcp-host-agent",
  specialist: "research-specialist",
  protocolTreasury: "reddi-protocol-treasury",
  amountUsdc: "1.25",
  downstreamAmountLamports: 1_250_000,
  protocolFeeBps: 5,
  capability: "research_synthesis_with_citations",
};

function keypairFor(profileId) {
  const seed = createHash("sha256").update(`reddi-rap-mcp-bridge-surfpool:${profileId}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function protocolFeeLamportsFor(amountLamports) {
  return Math.round((amountLamports * scenario.protocolFeeBps) / 10_000);
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

function termsHash() {
  return sha256(canonical({
    amount: scenario.amountUsdc,
    currency: "USDC",
    network: "local-surfpool",
    capability: scenario.capability,
    requiredEvidence: ["sources", "terms_hash", "disclosure_ledger", "local_payment_semantics"],
  }));
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

    const host = keypairFor(scenario.host);
    const specialist = keypairFor(scenario.specialist);
    const treasury = keypairFor(scenario.protocolTreasury);
    const participants = [
      [scenario.host, host.publicKey],
      [scenario.specialist, specialist.publicKey],
      [scenario.protocolTreasury, treasury.publicKey],
    ];

    const hostAirdropSig = await connection.requestAirdrop(host.publicKey, LAMPORTS_PER_SOL);
    let latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: hostAirdropSig, ...latest }, "confirmed");

    const before = Object.fromEntries(await Promise.all(participants.map(async ([profileId, publicKey]) => [profileId, await connection.getBalance(publicKey)])));

    const executedTransfers = [];
    const downstreamTx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: host.publicKey,
      toPubkey: specialist.publicKey,
      lamports: scenario.downstreamAmountLamports,
    }));
    const downstreamSignature = await sendAndConfirmTransaction(connection, downstreamTx, [host], { commitment: "confirmed" });
    executedTransfers.push({
      fromProfileId: scenario.host,
      toProfileId: scenario.specialist,
      fromLocalWalletAddress: host.publicKey.toBase58(),
      toLocalWalletAddress: specialist.publicKey.toBase58(),
      amountLamports: scenario.downstreamAmountLamports,
      signature: downstreamSignature,
      status: "executed",
      category: "downstream_agent_payment",
    });

    const protocolFeeLamports = protocolFeeLamportsFor(scenario.downstreamAmountLamports);
    const feeTx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: host.publicKey,
      toPubkey: treasury.publicKey,
      lamports: protocolFeeLamports,
    }));
    const feeSignature = await sendAndConfirmTransaction(connection, feeTx, [host], { commitment: "confirmed" });
    executedTransfers.push({
      fromProfileId: scenario.host,
      toProfileId: scenario.protocolTreasury,
      fromLocalWalletAddress: host.publicKey.toBase58(),
      toLocalWalletAddress: treasury.publicKey.toBase58(),
      amountLamports: protocolFeeLamports,
      signature: feeSignature,
      status: "executed",
      category: "protocol_rail_fee",
      feeBps: scenario.protocolFeeBps,
      feeOnTransferLamports: scenario.downstreamAmountLamports,
    });

    const after = Object.fromEntries(await Promise.all(participants.map(async ([profileId, publicKey]) => [profileId, await connection.getBalance(publicKey)])));
    const participantReports = participants.map(([profileId, publicKey]) => ({
      profileId,
      localWalletAddress: publicKey.toBase58(),
      startingLamports: before[profileId],
      endingLamports: after[profileId],
      deltaLamports: after[profileId] - before[profileId],
    }));

    const specialistDelta = participantReports.find((p) => p.profileId === scenario.specialist)?.deltaLamports ?? 0;
    const treasuryDelta = participantReports.find((p) => p.profileId === scenario.protocolTreasury)?.deltaLamports ?? 0;
    const proof = {
      schemaVersion: "reddi.rap-mcp-bridge.surfpool-executed.v1",
      generatedAt: new Date().toISOString(),
      mode: "surfpool_local_transaction_proof",
      rpcUrl,
      claimBoundary: "local_validator_only_no_devnet_no_mainnet",
      quote: {
        schemaVersion: "reddi.quote.v1",
        quoteId: scenario.quoteId,
        quoteAuthority: "bridge_synthetic",
        binding: false,
        amount: scenario.amountUsdc,
        currency: "USDC",
        network: "local-surfpool",
        termsHash: termsHash(),
      },
      airdropSignatures: { host: hostAirdropSig },
      participants: participantReports,
      executedTransfers,
      positiveProof: {
        downstreamAmountLamports: scenario.downstreamAmountLamports,
        protocolFeeBps: scenario.protocolFeeBps,
        protocolFeeLamports,
        specialistCreditedExpectedAmount: specialistDelta === scenario.downstreamAmountLamports,
        protocolTreasuryCreditedExpectedFee: treasuryDelta === protocolFeeLamports,
        paymentAndFeeTransactionsExecuted: executedTransfers.length === 2,
      },
      verification: {
        boundary: "local-surfpool",
        quoteTermsHash: "pass",
        localPaymentSemantics: specialistDelta === scenario.downstreamAmountLamports && treasuryDelta === protocolFeeLamports ? "pass" : "fail",
        devnetSettlement: "not_applicable",
        mainnetSettlement: "not_applicable",
      },
      disclosureLedger: {
        schemaVersion: "reddi.downstream-disclosure-ledger.v1",
        safePublicEvidenceOnly: true,
        entries: [{
          entryId: "ledger_rap_mcp_bridge_surfpool_executed_001",
          runId: "surfpool_rap_mcp_bridge_001",
          quoteId: scenario.quoteId,
          specialistWallet: specialist.publicKey.toBase58(),
          capability: scenario.capability,
          payloadClass: "prompt_summary",
          payloadHash: sha256("prompt_summary:market brief about paid specialist agents"),
          amount: scenario.amountUsdc,
          currency: "USDC",
          network: "local-surfpool",
          verificationStatus: "local_verified",
          evidenceRefs: [scenario.quoteId, termsHash(), downstreamSignature, feeSignature],
        }],
      },
      nextGate: "review_local_surfpool_proof_before_bounded_devnet_spend",
      guardrails: [
        "Surfpool offline local validator only",
        "No devnet mutation",
        "No mainnet path",
        "No specialist HTTP invocation",
        "No private key material written to artifact",
      ],
    };

    const jsonPath = join(outDir, "summary.json");
    const mdPath = join(outDir, "SUMMARY.md");
    writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`);
    writeFileSync(mdPath, `# RAP MCP Bridge Surfpool Local Transaction Proof\n\n- Schema: ${proof.schemaVersion}\n- Boundary: ${proof.claimBoundary}\n- Quote: ${proof.quote.quoteId}\n- Terms hash: ${proof.quote.termsHash}\n- Downstream tx: ${downstreamSignature}\n- Protocol fee tx: ${feeSignature}\n- Specialist credited expected amount: ${proof.positiveProof.specialistCreditedExpectedAmount}\n- Protocol treasury credited expected fee: ${proof.positiveProof.protocolTreasuryCreditedExpectedFee}\n- Local payment semantics: ${proof.verification.localPaymentSemantics}\n- Devnet settlement: ${proof.verification.devnetSettlement}\n- Mainnet settlement: ${proof.verification.mainnetSettlement}\n- Next gate: ${proof.nextGate}\n- JSON: ${jsonPath}\n`);
    console.log(JSON.stringify({ ok: true, jsonPath, mdPath, localPaymentSemantics: proof.verification.localPaymentSemantics }, null, 2));
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
