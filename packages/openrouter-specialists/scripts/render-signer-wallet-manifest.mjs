import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildSignerBackedWalletManifest,
  loadSignerKeypairsFromEnv,
  validateSignerBackedManifest,
} from '../dist/src/wallet-provenance.js';
import { specialistProfiles } from '../dist/src/profiles/index.js';

const outPath = process.env.WALLET_MANIFEST_OUT ?? process.argv[2] ?? join(process.cwd(), 'artifacts/signer-wallet-manifest.json');
const minimumBalanceLamports = Number(process.env.MIN_DEVNET_BALANCE_LAMPORTS ?? 1_000_000);

if (!Number.isFinite(minimumBalanceLamports) || minimumBalanceLamports < 0) {
  throw new Error('MIN_DEVNET_BALANCE_LAMPORTS must be a non-negative number');
}

const result = loadSignerKeypairsFromEnv({ profiles: specialistProfiles.slice(0, 5), requireAll: true });
const manifest = buildSignerBackedWalletManifest({ loaded: result.loaded, minimumBalanceLamports });
const errors = validateSignerBackedManifest(manifest, { requireSignerProvenance: true });
if (errors.length > 0) throw new Error(`rendered manifest failed validation:\n- ${errors.join('\n- ')}`);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
console.log(`rendered signer-backed public wallet manifest: ${outPath}`);
console.log(`profiles=${manifest.profiles.length}; network=${manifest.network}; secrets=redacted/not-written`);
