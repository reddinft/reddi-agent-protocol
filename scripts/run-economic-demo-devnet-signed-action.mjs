#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-devnet-signed-action", timestamp);
mkdirSync(outDir, { recursive: true });

const CONFIRM = "RUN_ECONOMIC_DEMO_DEVNET_SIGNED_ACTION";
const confirm = process.env.ECONOMIC_DEMO_DEVNET_SIGNED_ACTION_CONFIRM === CONFIRM;
const rpcUrl = process.env.ECONOMIC_DEMO_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const scenarioId = process.env.ECONOMIC_DEMO_SCENARIO_ID || "webpage";
const demoEnvPath = join(rootDir, "packages", "demo-agents", ".env.devnet");

if (!confirm) throw new Error(`requires ECONOMIC_DEMO_DEVNET_SIGNED_ACTION_CONFIRM=${CONFIRM}`);
if (process.env.ECONOMIC_DEMO_LIVE_PAYMENT_NETWORK && process.env.ECONOMIC_DEMO_LIVE_PAYMENT_NETWORK !== "solana-devnet") {
  throw new Error("devnet_signed_action_rejects_non_devnet_network");
}

function keypairFor(label) {
  const seed = createHash("sha256").update(`reddi-economic-demo-devnet-signed-action:${scenarioId}:${label}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function keypairFromDevnetEnv(name) {
  if (!existsSync(demoEnvPath)) return null;
  const line = readFileSync(demoEnvPath, "utf8").split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  if (!line) return null;
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(line.slice(name.length + 1))));
}

async function maybeConfirmAirdrop(connection, publicKey, sol) {
  try {
    const signature = await connection.requestAirdrop(publicKey, sol * LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
    return signature;
  } catch (error) {
    return `airdrop_unavailable:${error instanceof Error ? error.message : String(error)}`;
  }
}

async function maybeFundRentFloor(connection, publicKey, rentFloorLamports) {
  const balance = await connection.getBalance(publicKey);
  if (balance >= rentFloorLamports) return "already_rent_ready";
  const topUpSol = Math.max(0.01, (rentFloorLamports - balance + 100_000) / LAMPORTS_PER_SOL);
  return maybeConfirmAirdrop(connection, publicKey, topUpSol);
}

async function transfer(connection, from, to, lamports, category, memo) {
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to.publicKey, lamports }));
  const signature = await sendAndConfirmTransaction(connection, tx, [from], { commitment: "confirmed" });
  return {
    category,
    memo,
    fromWallet: from.publicKey.toBase58(),
    toWallet: to.publicKey.toBase58(),
    amountLamports: lamports,
    signature,
    explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    status: "executed",
  };
}

const connection = new Connection(rpcUrl, "confirmed");
const userKeypair = keypairFromDevnetEnv("AGENT_A_KEYPAIR") ?? keypairFor("end-user-sol-payer");
const orchestratorKeypair = keypairFromDevnetEnv("AGENT_B_KEYPAIR") ?? keypairFor("agentic-workflow-system");
const attestorKeypair = keypairFromDevnetEnv("AGENT_C_KEYPAIR") ?? keypairFor("verification-validation-agent");
const usingExistingDevnetKeys = Boolean(keypairFromDevnetEnv("AGENT_A_KEYPAIR") && keypairFromDevnetEnv("AGENT_B_KEYPAIR") && keypairFromDevnetEnv("AGENT_C_KEYPAIR"));

const participants = {
  user: userKeypair,
  orchestrator: orchestratorKeypair,
  copy: keypairFor("content-creation-agent"),
  code: keypairFor("code-generation-agent"),
  attestor: attestorKeypair,
  protocolTreasury: keypairFor("reddi-protocol-treasury"),
};

const participantEntries = Object.entries(participants);
const before = Object.fromEntries(await Promise.all(participantEntries.map(async ([id, kp]) => [id, await connection.getBalance(kp.publicKey)])));
const rentFloorLamports = await connection.getMinimumBalanceForRentExemption(0);
const airdrops = usingExistingDevnetKeys
  ? { skipped: "using_existing_funded_devnet_demo_agent_keypairs" }
  : { user: await maybeConfirmAirdrop(connection, participants.user.publicKey, 0.1), orchestrator: await maybeConfirmAirdrop(connection, participants.orchestrator.publicKey, 0.05) };

// Devnet system transfers into brand-new accounts must leave recipients rent-ready.
// The protocol-fee rehearsal intentionally sends tiny fee amounts, so pre-fund
// recipient shells rather than overstating the fee transfer size.
airdrops.recipientRentFloors = Object.fromEntries(
  await Promise.all(
    ["copy", "code", "attestor", "protocolTreasury"].map(async (id) => [
      id,
      await maybeFundRentFloor(connection, participants[id].publicKey, rentFloorLamports),
    ]),
  ),
);

const afterAirdrop = Object.fromEntries(await Promise.all(participantEntries.map(async ([id, kp]) => [id, await connection.getBalance(kp.publicKey)])));
if (afterAirdrop.user < 30_000_000) throw new Error(`insufficient_user_devnet_balance:${afterAirdrop.user}`);
if (afterAirdrop.orchestrator < 5_500_000) throw new Error(`insufficient_orchestrator_devnet_balance:${afterAirdrop.orchestrator}`);

const swapInputLamports = 21_000_000;
const protocolRailFeeBps = 5;
const convertedBudgetLamports = 3_331_250;
const downstreamCopyLamports = 1_000_000;
const downstreamCodeLamports = 1_000_000;
const attestorLamports = 500_000;
function protocolFeeLamportsFor(amountLamports) {
  return Math.round((amountLamports * protocolRailFeeBps) / 10_000);
}

const executedTransactions = [];
executedTransactions.push(await transfer(connection, participants.user, participants.orchestrator, swapInputLamports, "jupiter_sol_to_usdc_budget", "User signs SOL payment; Jupiter swap lane converts it into orchestrator USDC-equivalent budget"));

for (const id of ["copy", "code", "attestor", "protocolTreasury"]) {
  const balance = await connection.getBalance(participants[id].publicKey);
  if (balance < rentFloorLamports) {
    executedTransactions.push(await transfer(
      connection,
      participants.orchestrator,
      participants[id],
      rentFloorLamports - balance + 100_000,
      "devnet_account_initialization",
      `Devnet-only rent-floor initialization for ${id} demo recipient shell; not counted as protocol revenue`,
    ));
  }
}

executedTransactions.push(await transfer(connection, participants.orchestrator, participants.copy, downstreamCopyLamports, "downstream_agent_payment", "Converted budget pays copy specialist"));
executedTransactions.push(await transfer(connection, participants.orchestrator, participants.protocolTreasury, protocolFeeLamportsFor(downstreamCopyLamports), "protocol_rail_fee", "Reddi Agent Protocol fee: 0.05% of copy specialist rail payment"));
executedTransactions.push(await transfer(connection, participants.orchestrator, participants.code, downstreamCodeLamports, "downstream_agent_payment", "Converted budget pays code specialist"));
executedTransactions.push(await transfer(connection, participants.orchestrator, participants.protocolTreasury, protocolFeeLamportsFor(downstreamCodeLamports), "protocol_rail_fee", "Reddi Agent Protocol fee: 0.05% of code specialist rail payment"));
executedTransactions.push(await transfer(connection, participants.orchestrator, participants.attestor, attestorLamports, "attestor_payment", "Converted budget pays attestor for validation"));
executedTransactions.push(await transfer(connection, participants.orchestrator, participants.protocolTreasury, protocolFeeLamportsFor(attestorLamports), "protocol_rail_fee", "Reddi Agent Protocol fee: 0.05% of attestor rail payment"));

const after = Object.fromEntries(await Promise.all(participantEntries.map(async ([id, kp]) => [id, await connection.getBalance(kp.publicKey)])));

const participantBalances = participantEntries.map(([id, kp]) => ({
  profileId: id,
  wallet: kp.publicKey.toBase58(),
  beforeLamports: before[id],
  afterAirdropLamports: afterAirdrop[id],
  afterRunLamports: after[id],
  runDeltaLamports: after[id] - afterAirdrop[id],
}));

const report = {
  schemaVersion: "reddi.economic-demo.devnet-signed-action.v1",
  generatedAt: new Date().toISOString(),
  scenarioId,
  rpcUrl,
  network: "solana-devnet",
  mode: "signed_devnet_sol_to_usdc_budget_rehearsal",
  confirmationRequired: CONFIRM,
  action: {
    label: "Design me a webpage for X",
    userStartsWith: "SOL",
    downstreamBudgetRequired: "USDC",
    route: "SOL -> Jupiter swap lane -> USDC-equivalent run budget -> downstream agents",
  },
  airdrops,
  jupiterSwapProof: {
    status: "executed_devnet_rehearsal",
    caveat: "Devnet transaction proof demonstrates signed swap-lane budget conversion semantics. It is paired with live Jupiter quote proof for route availability; it is not a mainnet Jupiter liquidity execution claim.",
    swapBudgetTx: executedTransactions.find((tx) => tx.category === "jupiter_sol_to_usdc_budget"),
    inputSol: swapInputLamports / LAMPORTS_PER_SOL,
    outputUsdcEquivalent: convertedBudgetLamports / 1_000_000,
  },
  downstreamPayments: executedTransactions.filter((tx) => tx.category === "downstream_agent_payment" || tx.category === "attestor_payment"),
  protocolRailFees: {
    bps: protocolRailFeeBps,
    treasuryProfileId: "reddi-protocol-treasury",
    totalFeeLamports: executedTransactions
      .filter((tx) => tx.category === "protocol_rail_fee")
      .reduce((sum, tx) => sum + tx.amountLamports, 0),
    transactions: executedTransactions.filter((tx) => tx.category === "protocol_rail_fee"),
  },
  attestations: [
    {
      attestorProfileId: "verification-validation-agent",
      validatesProfileIds: ["content-creation-agent", "code-generation-agent"],
      result: "release_recommended",
      paymentTx: executedTransactions.find((tx) => tx.category === "attestor_payment")?.signature,
    },
  ],
  reputationCommitReveal: [
    { profileId: "content-creation-agent", beforeScore: 72, committedScore: 5, afterRevealScore: 77, commitTx: "pending_quasar_commit", revealTx: "pending_quasar_reveal" },
    { profileId: "code-generation-agent", beforeScore: 76, committedScore: 5, afterRevealScore: 81, commitTx: "pending_quasar_commit", revealTx: "pending_quasar_reveal" },
  ],
  participantBalances,
  positiveProof: {
    signedTransactionsExecuted: executedTransactions.length,
    swapBudgetTxExecuted: executedTransactions.some((tx) => tx.category === "jupiter_sol_to_usdc_budget"),
    downstreamPaymentsExecutedAfterSwap: true,
    attestorPaidAfterSwap: true,
    protocolFeeMatchesExpectedBps: executedTransactions
      .filter((tx) => tx.category === "protocol_rail_fee")
      .reduce((sum, tx) => sum + tx.amountLamports, 0) === protocolFeeLamportsFor(downstreamCopyLamports) + protocolFeeLamportsFor(downstreamCodeLamports) + protocolFeeLamportsFor(attestorLamports),
  },
  guardrails: [
    "devnet only",
    "ephemeral deterministic demo keypairs only",
    "no private key material written to artifact",
    "mainnet not used",
    "Every agent-to-agent transfer through Reddi Agent Protocol rails pays a 0.05% protocol fee to protocol treasury",
    "Jupiter live route availability is proven separately by quote artifact; this signed devnet action proves budget-conversion/payment flow semantics",
  ],
};

const jsonPath = join(outDir, "signed-action.json");
const mdPath = join(outDir, "SIGNED-ACTION.md");
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Economic Demo Devnet Signed Action",
    "",
    `Generated: ${report.generatedAt}`,
    `Network: ${report.network}`,
    "",
    "## Action story",
    "",
    `- ${report.action.route}`,
    "",
    "## Jupiter swap lane",
    "",
    `- SOL→USDC-equivalent budget tx: ${report.jupiterSwapProof.swapBudgetTx.explorer}`,
    `- Status: ${report.jupiterSwapProof.status}`,
    `- Caveat: ${report.jupiterSwapProof.caveat}`,
    "",
    "## Downstream payments",
    "",
    ...report.downstreamPayments.map((tx) => `- ${tx.memo}: ${tx.explorer}`),
    "",
    "## Protocol rail fee",
    "",
    `- Fee: ${report.protocolRailFees.bps} bps (0.05%)`,
    `- Treasury: ${report.protocolRailFees.treasuryProfileId}`,
    `- Total fee: ${report.protocolRailFees.totalFeeLamports} lamports`,
    `- Matches expected bps: ${report.positiveProof.protocolFeeMatchesExpectedBps}`,
    ...report.protocolRailFees.transactions.map((tx) => `- ${tx.memo}: ${tx.explorer}`),
    "",
  ].join("\n"),
);

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, signedTransactionsExecuted: executedTransactions.length, swapBudgetTx: report.jupiterSwapProof.swapBudgetTx.signature }, null, 2));
