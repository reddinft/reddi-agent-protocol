import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Keypair } from '@solana/web3.js';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const endpoint = process.env.RAP_MCP_X402_TOOL_LIST_ENDPOINT ?? 'https://reddi-code-generation.preview.reddi.tech/v1/chat/completions';
const usdcMint = process.env.RAP_MCP_DEVNET_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const dir = mkdtempSync(join(tmpdir(), 'rap-mcp-x402-tool-list-'));
const wallet = join(dir, 'wallet.json');
writeFileSync(wallet, JSON.stringify(Array.from(Keypair.generate().secretKey)), { mode: 0o600 });

const client = new Client({ name: 'rap-mcp-x402-tool-list-smoke', version: '0.1.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/src/server.js'],
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    REDDI_RAP_MCP_MODE: 'devnet',
    REDDI_MCP_STORE_DIR: join(dir, 'store'),
    RAP_MCP_DEVNET_PROOF_APPROVED: '1',
    RAP_MCP_ALLOW_SPECIALIST_INVOKE: '1',
    RAP_MCP_DEVNET_WALLET_KEYPAIR: wallet,
    RAP_MCP_DEVNET_USDC_MINT: usdcMint,
    RAP_MCP_SPECIALIST_ENDPOINT_ALLOWLIST: endpoint,
    RAP_MCP_DEVNET_MAX_USDC_MICRO_UNITS: '150000',
    // Deliberately unset: this smoke should not expose legacy synthetic devnet payment tools.
    RAP_MCP_DEVNET_FUNDER_KEYPAIR: '',
  },
  stderr: 'pipe',
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  const expected = [
    'reddi.execute_x402_specialist_call',
    'reddi.prepare_x402_specialist_call',
    'reddi.verify_x402_specialist_receipt',
  ];
  for (const name of expected) {
    if (!names.includes(name)) throw new Error(`missing gated x402 specialist tool: ${name}`);
  }
  for (const name of ['reddi.prepare_devnet_payment', 'reddi.execute_devnet_payment', 'reddi.verify_devnet_receipt']) {
    if (names.includes(name)) throw new Error(`legacy devnet payment tool unexpectedly exposed without funder keypair: ${name}`);
  }
  console.log(JSON.stringify({ ok: true, x402Tools: names.filter((name) => name.includes('x402_specialist')) }, null, 2));
} finally {
  await client.close().catch(() => undefined);
  rmSync(dir, { recursive: true, force: true });
}
