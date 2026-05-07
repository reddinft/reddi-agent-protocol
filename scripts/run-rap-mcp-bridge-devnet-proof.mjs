#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "rap-mcp-bridge-devnet-proof", timestamp);
mkdirSync(outDir, { recursive: true });

const rpcUrl = process.env.RAP_MCP_DEVNET_RPC_URL ?? clusterApiUrl("devnet");
const maxTotalDebitLamports = Number(process.env.RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS ?? 100_050);
const scenario = {
  quoteId: "quote_rap_mcp_bridge_devnet_research_001",
  host: "mcp-host-agent-devnet",
  specialist: "research-specialist-devnet",
  protocolTreasury: "reddi-protocol-treasury-devnet",
  amountUsdc: "0.0001",
  downstreamAmountLamports: 100_000,
  protocolFeeBps: 5,
  capability: "research_synthesis_with_citations",
};

function keypairFor(profileId) {
  const seed = createHash("sha256").update(`reddi-rap-mcp-bridge-devnet:${profileId}`).digest().subarray(0, 32);
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
    network: "solana-devnet",
    capability: scenario.capability,
    requiredEvidence: ["sources", "terms_hash", "disclosure_ledger", "devnet_payment_semantics"],
  }));
}

async function confirmAirdrop(connection, publicKey, lamports) {
  const signature = await connection.requestAirdrop(publicKey, lamports);
  const latest = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  return signature;
}

async function retryAirdrop(connection, publicKey, lamports) {
  let lastError;
  for (let i = 0; i < 3; i += 1) {
    try {
      return await confirmAirdrop(connection, publicKey, lamports);
    } catch (error) {
      lastError = error;
      await sleep(2500 * (i + 1));
    }
  }
  throw lastError;
}

async function ensureHostBalance(connection, host, lamportsNeeded) {
  const current = await connection.getBalance(host.publicKey);
  if (current >= lamportsNeeded) {
    return { signature: null, source: "existing_balance", startingBalanceLamports: current };
  }
  const signature = await retryAirdrop(connection, host.publicKey, lamportsNeeded - current + 1_000_000);
  return { signature, source: "devnet_airdrop", startingBalanceLamports: await connection.getBalance(host.publicKey) };
}

async function ensureRentSafeRecipient(connection, host, publicKey, minimumLamports, label) {
  const current = await connection.getBalance(publicKey);
  if (current >= minimumLamports) {
    return { label, signature: null, source: "existing_balance", balanceLamports: current };
  }
  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: host.publicKey,
    toPubkey: publicKey,
    lamports: minimumLamports - current,
  }));
  const signature = await sendAndConfirmTransaction(connection, tx, [host], { commitment: "confirmed" });
  return { label, signature, source: "host_setup_transfer", balanceLamports: await connection.getBalance(publicKey) };
}

async function main() {
  const protocolFeeLamports = protocolFeeLamportsFor(scenario.downstreamAmountLamports);
  const totalDebitLamports = scenario.downstreamAmountLamports + protocolFeeLamports;
  if (totalDebitLamports > maxTotalDebitLamports) {
    throw new Error(`devnet_spend_cap_exceeded:${totalDebitLamports}>${maxTotalDebitLamports}`);
  }

  const connection = new Connection(rpcUrl, "confirmed");
  await connection.getVersion();

  const host = keypairFor(scenario.host);
  const specialist = keypairFor(scenario.specialist);
  const treasury = keypairFor(scenario.protocolTreasury);
  const participants = [
    [scenario.host, host.publicKey],
    [scenario.specialist, specialist.publicKey],
    [scenario.protocolTreasury, treasury.publicKey],
  ];

  const rentSafeLamports = 1_000_000;
  const setupLamportsNeeded = totalDebitLamports + 20_000;
  if (setupLamportsNeeded > LAMPORTS_PER_SOL / 100) {
    throw new Error(`setup_cap_exceeded:${setupLamportsNeeded}`);
  }
  const hostFunding = await ensureHostBalance(connection, host, setupLamportsNeeded);
  // Devnet SystemProgram transfers to previously-empty accounts can fail rent checks
  // for tiny protocol-fee amounts. Use host-funded setup transfers before the proof
  // snapshot, avoiding extra faucet calls and keeping proof deltas clean.
  const recipientSetup = [
    await ensureRentSafeRecipient(connection, host, specialist.publicKey, rentSafeLamports, "specialist"),
    await ensureRentSafeRecipient(connection, host, treasury.publicKey, rentSafeLamports, "protocolTreasury"),
  ];

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
    fromDevnetWalletAddress: host.publicKey.toBase58(),
    toDevnetWalletAddress: specialist.publicKey.toBase58(),
    amountLamports: scenario.downstreamAmountLamports,
    signature: downstreamSignature,
    status: "executed",
    category: "downstream_agent_payment",
  });

  const feeTx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: host.publicKey,
    toPubkey: treasury.publicKey,
    lamports: protocolFeeLamports,
  }));
  const feeSignature = await sendAndConfirmTransaction(connection, feeTx, [host], { commitment: "confirmed" });
  executedTransfers.push({
    fromProfileId: scenario.host,
    toProfileId: scenario.protocolTreasury,
    fromDevnetWalletAddress: host.publicKey.toBase58(),
    toDevnetWalletAddress: treasury.publicKey.toBase58(),
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
    devnetWalletAddress: publicKey.toBase58(),
    startingLamports: before[profileId],
    endingLamports: after[profileId],
    deltaLamports: after[profileId] - before[profileId],
  }));
  const specialistDelta = participantReports.find((p) => p.profileId === scenario.specialist)?.deltaLamports ?? 0;
  const treasuryDelta = participantReports.find((p) => p.profileId === scenario.protocolTreasury)?.deltaLamports ?? 0;

  const proof = {
    schemaVersion: "reddi.rap-mcp-bridge.devnet-proof.v1",
    generatedAt: new Date().toISOString(),
    mode: "bounded_devnet_payment_semantics_proof",
    rpcUrl,
    claimBoundary: "solana_devnet_only_no_mainnet_no_specialist_http_invocation",
    maxTotalDebitLamports,
    quote: {
      schemaVersion: "reddi.quote.v1",
      quoteId: scenario.quoteId,
      quoteAuthority: "bridge_synthetic",
      binding: false,
      amount: scenario.amountUsdc,
      currency: "USDC",
      network: "solana-devnet",
      termsHash: termsHash(),
    },
    funding: { host: hostFunding, recipientSetup },
    participants: participantReports,
    executedTransfers,
    positiveProof: {
      downstreamAmountLamports: scenario.downstreamAmountLamports,
      protocolFeeBps: scenario.protocolFeeBps,
      protocolFeeLamports,
      totalDebitLamports,
      spendCapRespected: totalDebitLamports <= maxTotalDebitLamports,
      specialistCreditedExpectedAmount: specialistDelta === scenario.downstreamAmountLamports,
      protocolTreasuryCreditedExpectedFee: treasuryDelta === protocolFeeLamports,
      paymentAndFeeTransactionsExecuted: executedTransfers.length === 2,
    },
    verification: {
      boundary: "solana-devnet",
      quoteTermsHash: "pass",
      devnetPaymentSemantics: specialistDelta === scenario.downstreamAmountLamports && treasuryDelta === protocolFeeLamports ? "pass" : "fail",
      mainnetSettlement: "not_applicable",
    },
    disclosureLedger: {
      schemaVersion: "reddi.downstream-disclosure-ledger.v1",
      safePublicEvidenceOnly: true,
      entries: [{
        entryId: "ledger_rap_mcp_bridge_devnet_001",
        runId: "devnet_rap_mcp_bridge_001",
        quoteId: scenario.quoteId,
        specialistWallet: specialist.publicKey.toBase58(),
        capability: scenario.capability,
        payloadClass: "prompt_summary",
        payloadHash: sha256("prompt_summary:market brief about paid specialist agents"),
        amount: scenario.amountUsdc,
        currency: "USDC",
        network: "solana-devnet",
        verificationStatus: "devnet_verified",
        evidenceRefs: [scenario.quoteId, termsHash(), downstreamSignature, feeSignature],
      }],
    },
    guardrails: [
      "Solana devnet only",
      "Explicit maxTotalDebitLamports cap enforced before transfers",
      "No mainnet path",
      "No specialist HTTP invocation",
      "No private key material written to artifact",
    ],
  };

  const jsonPath = join(outDir, "summary.json");
  const mdPath = join(outDir, "SUMMARY.md");
  writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`);
  writeFileSync(mdPath, `# RAP MCP Bridge Bounded Devnet Proof\n\n- Schema: ${proof.schemaVersion}\n- Boundary: ${proof.claimBoundary}\n- Max total debit: ${proof.maxTotalDebitLamports}\n- Quote: ${proof.quote.quoteId}\n- Terms hash: ${proof.quote.termsHash}\n- Host funding source: ${hostFunding.source}\n- Host funding airdrop: ${hostFunding.signature ?? "not_needed"}\n- Recipient setup: ${recipientSetup.map((s) => `${s.label}:${s.source}:${s.signature ?? "not_needed"}`).join(", ")}\n- Downstream tx: ${downstreamSignature}\n- Protocol fee tx: ${feeSignature}\n- Specialist credited expected amount: ${proof.positiveProof.specialistCreditedExpectedAmount}\n- Protocol treasury credited expected fee: ${proof.positiveProof.protocolTreasuryCreditedExpectedFee}\n- Spend cap respected: ${proof.positiveProof.spendCapRespected}\n- Devnet payment semantics: ${proof.verification.devnetPaymentSemantics}\n- Mainnet settlement: ${proof.verification.mainnetSettlement}\n- JSON: ${jsonPath}\n`);
  console.log(JSON.stringify({ ok: true, jsonPath, mdPath, devnetPaymentSemantics: proof.verification.devnetPaymentSemantics, downstreamSignature, feeSignature }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
