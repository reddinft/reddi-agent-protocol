#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-devnet-wallet-backed-jupiter-swap", timestamp);
mkdirSync(outDir, { recursive: true });

const CONFIRM = "RUN_ECONOMIC_DEMO_DEVNET_WALLET_BACKED_JUPITER_SWAP";
const confirm = process.env.ECONOMIC_DEMO_DEVNET_WALLET_BACKED_JUPITER_SWAP_CONFIRM;
const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const quoteApiBase = process.env.JUPITER_QUOTE_API_BASE || "https://quote-api.jup.ag/v6";
const inputMint = process.env.ECONOMIC_DEMO_JUPITER_INPUT_MINT || "So11111111111111111111111111111111111111112";
const outputMint = process.env.ECONOMIC_DEMO_JUPITER_OUTPUT_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const amountLamports = Number(process.env.ECONOMIC_DEMO_JUPITER_INPUT_LAMPORTS || "1000000");
const slippageBps = Number(process.env.ECONOMIC_DEMO_JUPITER_SLIPPAGE_BPS || "75");
const skipPreflight = process.env.ECONOMIC_DEMO_JUPITER_SKIP_PREFLIGHT === "1";

function writeJson(name, value) {
  writeFileSync(join(outDir, name), JSON.stringify(value, null, 2));
}

function fail(code, summary, extra = {}) {
  const artifact = {
    schemaVersion: "reddi.economic-demo.devnet-wallet-backed-jupiter-swap.v1",
    generatedAt: new Date().toISOString(),
    ok: false,
    status: code,
    summary,
    confirmationRequired: CONFIRM,
    rpcUrl,
    quoteApiBase,
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
    skipPreflight,
    ...extra,
    guardrails: ["devnet RPC only", "existing funded devnet demo keypair", "no private key material written to artifact", "mainnet transaction submission disabled"],
  };
  writeJson("wallet-backed-jupiter-swap.json", artifact);
  console.log(JSON.stringify({ ok: false, status: code, outDir, artifactPath: join(outDir, "wallet-backed-jupiter-swap.json") }, null, 2));
  process.exitCode = 1;
}

if (confirm !== CONFIRM) {
  fail("confirmation_missing", `Set ECONOMIC_DEMO_DEVNET_WALLET_BACKED_JUPITER_SWAP_CONFIRM=${CONFIRM} to run.`);
  process.exit();
}

function loadDevnetUserKeypair() {
  const envPath = join(rootDir, "packages", "demo-agents", ".env.devnet");
  const text = readFileSync(envPath, "utf8");
  const match = text.match(/^AGENT_A_KEYPAIR=(.*)$/m);
  if (!match) throw new Error("AGENT_A_KEYPAIR missing in packages/demo-agents/.env.devnet");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(match[1])));
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, headers: Object.fromEntries(res.headers), json, text };
}

try {
  const wallet = loadDevnetUserKeypair();
  const connection = new Connection(rpcUrl, "confirmed");
  const beforeBalance = await connection.getBalance(wallet.publicKey);

  const quoteUrl = new URL(`${quoteApiBase.replace(/\/$/, "")}/quote`);
  quoteUrl.searchParams.set("inputMint", inputMint);
  quoteUrl.searchParams.set("outputMint", outputMint);
  quoteUrl.searchParams.set("amount", String(amountLamports));
  quoteUrl.searchParams.set("slippageBps", String(slippageBps));

  const quote = await fetchJson(quoteUrl, { method: "GET" });
  writeJson("01-quote-response.json", { url: quoteUrl.toString(), status: quote.status, ok: quote.ok, body: quote.json });
  if (!quote.ok) {
    fail("jupiter_quote_failed", "Jupiter quote request failed before a wallet-backed swap transaction could be built.", {
      wallet: wallet.publicKey.toBase58(),
      beforeBalanceLamports: beforeBalance,
      quoteStatus: quote.status,
      quoteBody: quote.json,
    });
    process.exit();
  }

  const swap = await fetchJson(`${quoteApiBase.replace(/\/$/, "")}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote.json,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  writeJson("02-swap-response.json", { status: swap.status, ok: swap.ok, body: swap.json });
  if (!swap.ok || !swap.json?.swapTransaction) {
    fail("jupiter_swap_transaction_failed", "Jupiter did not return a swap transaction for the devnet wallet-backed attempt.", {
      wallet: wallet.publicKey.toBase58(),
      beforeBalanceLamports: beforeBalance,
      quote: quote.json,
      swapStatus: swap.status,
      swapBody: swap.json,
    });
    process.exit();
  }

  const tx = VersionedTransaction.deserialize(Buffer.from(swap.json.swapTransaction, "base64"));
  tx.sign([wallet]);
  const signedTransactionBase64 = Buffer.from(tx.serialize()).toString("base64");
  writeJson("03-signed-transaction-metadata.json", {
    wallet: wallet.publicKey.toBase58(),
    signatures: tx.signatures.map((sig) => Buffer.from(sig).toString("base64")),
    messageBytes: tx.message.serialize().length,
    signedTransactionBytes: tx.serialize().length,
  });

  let signature = null;
  let sendError = null;
  try {
    signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight, maxRetries: 2 });
    await connection.confirmTransaction(signature, "confirmed");
  } catch (err) {
    sendError = err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { message: String(err) };
  }

  const afterBalance = await connection.getBalance(wallet.publicKey);
  const artifact = {
    schemaVersion: "reddi.economic-demo.devnet-wallet-backed-jupiter-swap.v1",
    generatedAt: new Date().toISOString(),
    ok: Boolean(signature && !sendError),
    status: signature && !sendError ? "executed" : "signed_but_devnet_send_failed",
    summary: signature && !sendError
      ? "Wallet-backed Jupiter swap transaction signed and submitted on devnet."
      : "Jupiter returned a wallet-specific swap transaction and the devnet wallet signed it, but devnet RPC rejected submission. This is the expected boundary if Jupiter transaction/account/blockhash material targets mainnet liquidity rather than devnet.",
    confirmationRequired: CONFIRM,
    rpcUrl,
    quoteApiBase,
    wallet: wallet.publicKey.toBase58(),
    beforeBalanceLamports: beforeBalance,
    afterBalanceLamports: afterBalance,
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
    skipPreflight,
    quote: {
      inAmount: quote.json?.inAmount,
      outAmount: quote.json?.outAmount,
      contextSlot: quote.json?.contextSlot,
      routePlanLength: Array.isArray(quote.json?.routePlan) ? quote.json.routePlan.length : null,
    },
    swapTransactionReceived: true,
    walletSignedTransaction: true,
    signedTransactionBase64Redacted: `${signedTransactionBase64.slice(0, 24)}...${signedTransactionBase64.slice(-24)}`,
    signature,
    explorer: signature ? `https://explorer.solana.com/tx/${signature}?cluster=devnet` : null,
    sendError,
    guardrails: ["devnet RPC only", "existing funded devnet demo keypair", "no private key material written to artifact", "mainnet transaction submission disabled"],
  };
  writeJson("wallet-backed-jupiter-swap.json", artifact);
  console.log(JSON.stringify({ ok: artifact.ok, status: artifact.status, signature, outDir, artifactPath: join(outDir, "wallet-backed-jupiter-swap.json") }, null, 2));
  if (!artifact.ok) process.exitCode = 2;
} catch (err) {
  fail("unexpected_error", err instanceof Error ? err.message : String(err), {
    error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { message: String(err) },
  });
}
