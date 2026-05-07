#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildRapMcpBridgeSurfpoolProof } from '../lib/mcp-bridge-demo/surfpool-proof.ts';

const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outDir = join(process.cwd(), 'artifacts', 'rap-mcp-bridge-surfpool-local', timestamp);
mkdirSync(outDir, { recursive: true });

const proof = buildRapMcpBridgeSurfpoolProof();
const jsonPath = join(outDir, 'summary.json');
const mdPath = join(outDir, 'SUMMARY.md');
writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`);
writeFileSync(mdPath, `# RAP MCP Bridge Surfpool Local Proof Plan\n\n- Schema: ${proof.schemaVersion}\n- Boundary: ${proof.claimBoundary}\n- Quote: ${proof.quote.quoteId}\n- Quote authority: ${proof.quote.quoteAuthority}\n- Binding: ${proof.quote.binding}\n- Terms hash: ${proof.quote.termsHash}\n- Downstream amount: ${proof.localPaymentSemantics.downstreamAmountLamports} lamports\n- Protocol fee: ${proof.localPaymentSemantics.protocolFeeLamports} lamports (${proof.localPaymentSemantics.protocolFeeBps} bps)\n- Total debit: ${proof.localPaymentSemantics.totalDebitLamports} lamports\n- Devnet settlement: ${proof.verification.devnetSettlement}\n- Mainnet settlement: ${proof.verification.mainnetSettlement}\n- Next gate: ${proof.nextGate}\n- JSON: ${jsonPath}\n`);
console.log(JSON.stringify({ ok: true, jsonPath, mdPath }, null, 2));
