import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWalletReadinessReport } from '../dist/src/index.js';

const signerManifestPath = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? process.env.SIGNER_BACKED_WALLET_MANIFEST ?? join(process.cwd(), 'public/wallet-manifest.json');
const outPath = process.env.WALLET_READINESS_OUT ?? join(process.cwd(), 'artifacts/wallet-readiness.json');
const signerBackedManifest = signerManifestPath ? JSON.parse(readFileSync(signerManifestPath, 'utf8')) : undefined;
const report = buildWalletReadinessReport({ signerBackedManifest });

mkdirSync(join(outPath, '..'), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'ready') process.exitCode = 1;
