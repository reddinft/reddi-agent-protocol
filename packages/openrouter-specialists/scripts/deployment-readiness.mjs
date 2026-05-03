import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDeploymentReadinessReport } from '../dist/src/index.js';

const manifestPath = process.argv[2] ?? join(process.cwd(), 'public/wallet-manifest.json');
const outPath = process.env.READINESS_OUT ?? join(process.cwd(), 'artifacts/deployment-readiness.json');
const endpointBaseUrl = process.env.PUBLIC_BASE_URL;
const fundedProfileIds = (process.env.FUNDED_PROFILE_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
const deployedProfileIds = (process.env.DEPLOYED_PROFILE_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const report = buildDeploymentReadinessReport({ manifest, endpointBaseUrl, fundedProfileIds, deployedProfileIds });

mkdirSync(join(outPath, '..'), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'ready') process.exitCode = 1;
