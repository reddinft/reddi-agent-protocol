import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const storeDir = mkdtempSync(join(tmpdir(), 'rap-mcp-bridge-smoke-'));
const client = new Client({ name: 'rap-mcp-bridge-smoke', version: '0.1.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/src/server.js'],
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    REDDI_MCP_POLICY_MODE: 'dry_run',
    REDDI_MCP_STORE_DIR: storeDir,
  },
  stderr: 'pipe',
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  const expected = [
    'reddi.discover_specialists',
    'reddi.export_disclosure_ledger',
    'reddi.request_quote',
    'reddi.verify_receipt',
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`tool list mismatch: ${JSON.stringify(names)}`);
  }

  const quoteResult = await client.callTool({
    name: 'reddi.request_quote',
    arguments: {
      taskSummary: 'Summarize Reddi Agent Protocol MCP bridge.',
      capability: 'research',
      amount: '1.25',
      currency: 'USDC',
      network: 'demo',
      evidenceRefs: ['sources'],
      idempotencyKey: 'smoke-quote-1',
    },
  });
  const text = quoteResult.content?.[0]?.text;
  const quote = JSON.parse(text);
  if (quote.quoteAuthority !== 'bridge_synthetic' || quote.binding !== false) {
    throw new Error('quote honesty fields missing or wrong');
  }
  if (!quote.termsHash?.startsWith('sha256:')) {
    throw new Error('termsHash missing');
  }

  const verifyResult = await client.callTool({
    name: 'reddi.verify_receipt',
    arguments: { quoteId: quote.quoteId, termsHash: quote.termsHash },
  });
  const verification = JSON.parse(verifyResult.content?.[0]?.text);
  if (verification.verified !== false || verification.checks.paymentReceipt !== 'not_applicable') {
    throw new Error('dry-run verification overclaimed payment settlement');
  }

  console.log(JSON.stringify({ ok: true, tools: names, quoteId: quote.quoteId }, null, 2));
} finally {
  await client.close().catch(() => undefined);
  rmSync(storeDir, { recursive: true, force: true });
}
