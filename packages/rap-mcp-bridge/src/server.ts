#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { currentPolicy } from "./policy.js";
import { RapClient } from "./rap-client.js";
import { BridgeStore } from "./store.js";
import {
  discoverInputSchema,
  executeDevnetPaymentInputSchema,
  exportDisclosureLedgerInputSchema,
  prepareDevnetPaymentInputSchema,
  requestQuoteInputSchema,
  verifyDevnetReceiptInputSchema,
  verifyReceiptInputSchema,
} from "./schemas.js";
import { requestQuote } from "./tools/request-quote.js";
import { verifyReceipt } from "./tools/verify-receipt.js";
import { exportDisclosureLedger } from "./tools/export-disclosure-ledger.js";
import { executeDevnetPayment, prepareDevnetPayment, verifyDevnetReceipt } from "./tools/devnet-payment.js";

function jsonContent(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function createServer(env: NodeJS.ProcessEnv = process.env) {
  const config = loadConfig(env);
  const policy = currentPolicy(config.policyMode);
  const client = new RapClient(config);
  const store = new BridgeStore(config.storeDir);
  const server = new McpServer({ name: "reddi-rap-mcp-bridge", version: "0.1.0" });

  server.registerTool("reddi.discover_specialists", {
    description: "Discover Reddi Agent Protocol specialists through the local RAP backend. Dry-run only; no payment or invocation.",
    inputSchema: discoverInputSchema,
  }, async (args) => jsonContent(await client.discoverSpecialists(args)));

  server.registerTool("reddi.request_quote", {
    description: "Create a synthetic, non-binding dry-run quote for specialist work. Does not contact or bind a specialist.",
    inputSchema: requestQuoteInputSchema,
  }, async (args) => jsonContent(requestQuote(args, store)));

  server.registerTool("reddi.verify_receipt", {
    description: "Verify dry-run quote/terms evidence. Does not prove payment settlement in the first PR.",
    inputSchema: verifyReceiptInputSchema,
  }, async (args) => jsonContent(verifyReceipt(args, store)));

  server.registerTool("reddi.export_disclosure_ledger", {
    description: "Export a safe public disclosure ledger for bridge-generated quote plans.",
    inputSchema: exportDisclosureLedgerInputSchema,
  }, async (args) => jsonContent(exportDisclosureLedger(args, store)));

  if (config.policyMode === "devnet") {
    server.registerTool("reddi.prepare_devnet_payment", {
      description: "Prepare a bounded Solana devnet payment for a bridge quote. Non-mutating readiness check; no mainnet and no specialist invocation.",
      inputSchema: prepareDevnetPaymentInputSchema,
    }, async (args) => jsonContent(await prepareDevnetPayment(args, config, store)));

    server.registerTool("reddi.execute_devnet_payment", {
      description: "Execute a capped, idempotent Solana devnet payment for a bridge quote. Requires explicit env gates and approval phrase; no mainnet and no specialist invocation.",
      inputSchema: executeDevnetPaymentInputSchema,
    }, async (args) => jsonContent(await executeDevnetPayment(args, config, store)));

    server.registerTool("reddi.verify_devnet_receipt", {
      description: "Verify bridge-stored Solana devnet payment receipts. Never claims mainnet settlement.",
      inputSchema: verifyDevnetReceiptInputSchema,
    }, async (args) => jsonContent(await verifyDevnetReceipt(args, store)));
  }

  server.registerResource("reddi-policy-current", "reddi://policy/current", {
    title: "Current RAP MCP Bridge policy",
    description: "Dry-run policy state for the RAP MCP Bridge.",
    mimeType: "application/json",
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ config: { rapBaseUrl: config.rapBaseUrl, hostFramework: config.hostFramework, agentName: config.agentName, policyMode: config.policyMode, devnetProofApproved: config.devnetProofApproved, devnetFunderConfigured: Boolean(config.devnetFunderKeypairPath) }, policy }, null, 2) }],
  }));

  return server;
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("rap-mcp-bridge: stdio MCP server for Reddi Agent Protocol. First PR mode is dry_run only.");
    return;
  }
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
