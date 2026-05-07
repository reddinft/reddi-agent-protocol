import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (process.env.RAP_MCP_DEVNET_PROOF_APPROVED !== '1') {
  throw new Error('set RAP_MCP_DEVNET_PROOF_APPROVED=1 to run live devnet MCP smoke');
}
if (!process.env.RAP_MCP_DEVNET_FUNDER_KEYPAIR) {
  throw new Error('set RAP_MCP_DEVNET_FUNDER_KEYPAIR to a funded devnet keypair path');
}

const storeDir = process.env.REDDI_MCP_STORE_DIR || mkdtempSync(join(tmpdir(), 'rap-mcp-bridge-devnet-smoke-'));
const client = new Client({ name: 'rap-mcp-bridge-devnet-smoke', version: '0.1.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/src/server.js'],
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    REDDI_RAP_MCP_MODE: 'devnet',
    REDDI_MCP_STORE_DIR: storeDir,
    RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS: process.env.RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS ?? '100050',
  },
  stderr: 'pipe',
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  for (const name of ['reddi.prepare_devnet_payment', 'reddi.execute_devnet_payment', 'reddi.verify_devnet_receipt']) {
    if (!names.includes(name)) throw new Error(`missing devnet tool: ${name}`);
  }

  const quoteResult = await client.callTool({
    name: 'reddi.request_quote',
    arguments: {
      taskSummary: 'Live devnet MCP smoke: pay a research specialist through Reddi Agent Protocol devnet semantics.',
      capability: 'research_synthesis_with_citations',
      amount: '0.0001',
      currency: 'SOL',
      network: 'solana-devnet',
      evidenceRefs: ['devnet-mcp-smoke'],
      idempotencyKey: `devnet-mcp-quote-${Date.now()}`,
    },
  });
  const parseToolJson = (result, label) => {
    const text = result.content?.[0]?.text;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${label} returned non-JSON: ${text}`);
    }
  };

  const quote = parseToolJson(quoteResult, 'request_quote');

  const prepareResult = await client.callTool({
    name: 'reddi.prepare_devnet_payment',
    arguments: { quoteId: quote.quoteId, maxTotalDebitLamports: 100050 },
  });
  const readiness = parseToolJson(prepareResult, 'prepare_devnet_payment');
  if (!readiness.spendCapRespected) throw new Error('readiness cap not respected');

  const executeResult = await client.callTool({
    name: 'reddi.execute_devnet_payment',
    arguments: {
      quoteId: quote.quoteId,
      idempotencyKey: `devnet-mcp-exec-${quote.quoteId}`,
      maxTotalDebitLamports: 100050,
      approvalPhrase: 'EXECUTE_DEVNET_RAP_PAYMENT',
    },
  });
  const receipt = parseToolJson(executeResult, 'execute_devnet_payment');
  if (receipt.verification?.devnetPaymentSemantics !== 'pass') {
    throw new Error(`devnet payment semantics failed: ${JSON.stringify(receipt.verification)}`);
  }

  const verifyResult = await client.callTool({
    name: 'reddi.verify_devnet_receipt',
    arguments: { quoteId: quote.quoteId },
  });
  const verification = parseToolJson(verifyResult, 'verify_devnet_receipt');
  if (verification.verified !== true || verification.mainnetSettlement !== 'not_applicable') {
    throw new Error(`verification failed or overclaimed: ${JSON.stringify(verification)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    tools: names,
    quoteId: quote.quoteId,
    readiness: { spendCapRespected: readiness.spendCapRespected, wallets: readiness.wallets },
    transactions: receipt.transactions,
    verification: verification.verified,
  }, null, 2));
} finally {
  await client.close().catch(() => undefined);
  if (!process.env.REDDI_MCP_STORE_DIR) rmSync(storeDir, { recursive: true, force: true });
}
