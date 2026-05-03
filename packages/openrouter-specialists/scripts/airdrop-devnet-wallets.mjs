import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { validateSignerBackedManifest } from '../dist/src/wallet-provenance.js';

const manifestPath = process.argv[2] ?? process.env.WALLET_MANIFEST_PATH ?? join(process.cwd(), 'public/wallet-manifest.json');
const outPath = process.env.AIRDROP_ARTIFACT_OUT ?? join(process.cwd(), 'artifacts/devnet-airdrop-report.json');
const endpoint = process.env.SOLANA_DEVNET_RPC_URL ?? clusterApiUrl('devnet');
const targetLamports = Number(process.env.MIN_DEVNET_BALANCE_LAMPORTS ?? process.env.AIRDROP_TARGET_LAMPORTS ?? 1_000_000);
const requestLamports = Number(process.env.AIRDROP_LAMPORTS ?? Math.max(targetLamports, Math.floor(0.05 * LAMPORTS_PER_SOL)));
const maxAttempts = Number(process.env.AIRDROP_MAX_ATTEMPTS ?? 3);
const baseDelayMs = Number(process.env.AIRDROP_RETRY_BASE_MS ?? 2_000);

if (!endpoint.includes('devnet')) throw new Error('airdrop script is devnet-only; SOLANA_DEVNET_RPC_URL must point at devnet');
for (const [name, value] of Object.entries({ targetLamports, requestLamports, maxAttempts, baseDelayMs })) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const errors = validateSignerBackedManifest(manifest, { requireSignerProvenance: false });
if (errors.length > 0) throw new Error(`manifest failed validation:\n- ${errors.join('\n- ')}`);
if (manifest.network !== 'solana-devnet') throw new Error('airdrop script is devnet-only');

const connection = new Connection(endpoint, 'confirmed');
const report = [];
for (const profile of manifest.profiles) {
  const publicKey = new PublicKey(profile.publicKey);
  const beforeLamports = await connection.getBalance(publicKey, 'confirmed');
  const entry = {
    profileId: profile.profileId,
    publicKey: profile.publicKey,
    beforeLamports,
    requestedLamports: 0,
    afterLamports: beforeLamports,
    txSignatures: [],
    status: beforeLamports >= targetLamports ? 'already_funded' : 'pending',
    errors: [],
  };

  for (let attempt = 1; entry.afterLamports < targetLamports && attempt <= maxAttempts; attempt += 1) {
    try {
      const signature = await connection.requestAirdrop(publicKey, requestLamports);
      await connection.confirmTransaction(signature, 'confirmed');
      entry.txSignatures.push(signature);
      entry.requestedLamports += requestLamports;
      entry.afterLamports = await connection.getBalance(publicKey, 'confirmed');
      entry.status = entry.afterLamports >= targetLamports ? 'funded' : 'below_threshold';
    } catch (error) {
      entry.errors.push(String(error?.message ?? error));
      if (attempt < maxAttempts) await delay(baseDelayMs * 2 ** (attempt - 1));
      entry.afterLamports = await connection.getBalance(publicKey, 'confirmed').catch(() => entry.afterLamports);
      entry.status = 'airdrop_failed';
    }
  }
  if (entry.afterLamports < targetLamports && entry.status !== 'airdrop_failed') entry.status = 'below_threshold';
  report.push(entry);
}

const artifact = {
  schemaVersion: '1.0.0',
  network: 'solana-devnet',
  endpoint,
  manifestPath,
  targetLamports,
  requestLamports,
  maxAttempts,
  generatedAt: new Date().toISOString(),
  report,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify(artifact, null, 2));
if (report.some((entry) => entry.afterLamports < targetLamports)) process.exitCode = 1;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
