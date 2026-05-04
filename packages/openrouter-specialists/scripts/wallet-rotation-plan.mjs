import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWalletRotationPlan } from '../dist/src/wallet-rotation-plan.js';

const currentManifestPath = process.env.WALLET_MANIFEST_PATH ?? join(process.cwd(), 'public/wallet-manifest.json');
const candidateManifestPath = process.env.SIGNER_WALLET_MANIFEST_PATH ?? process.argv[2];
const currentManifest = JSON.parse(readFileSync(currentManifestPath, 'utf8'));
const candidateManifest = candidateManifestPath ? JSON.parse(readFileSync(candidateManifestPath, 'utf8')) : undefined;

const report = buildWalletRotationPlan({ currentManifest, candidateManifest });
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'ready_for_operator_funding_approval') process.exitCode = 1;
