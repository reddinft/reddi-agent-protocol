import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

const manifestPath = process.argv[2] ?? join(process.cwd(), 'public/wallet-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.network !== 'solana-devnet') throw new Error('balance verifier is devnet-only');

const threshold = Number(process.env.MIN_DEVNET_BALANCE_LAMPORTS ?? manifest.minimumBalanceLamports ?? 0);
const endpoint = process.env.SOLANA_DEVNET_RPC_URL ?? clusterApiUrl('devnet');
const connection = new Connection(endpoint, 'confirmed');

const report = [];
for (const profile of manifest.profiles) {
  const publicKey = new PublicKey(profile.publicKey);
  const lamports = await connection.getBalance(publicKey, 'confirmed');
  report.push({
    profileId: profile.profileId,
    publicKey: profile.publicKey,
    lamports,
    belowThreshold: lamports < threshold,
  });
}

console.log(JSON.stringify({ network: manifest.network, endpoint, thresholdLamports: threshold, report }, null, 2));
if (report.some((entry) => entry.belowThreshold)) process.exitCode = 1;
