import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PublicKey } from '@solana/web3.js';

const manifestPath = process.argv[2] ?? join(process.cwd(), 'public/wallet-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function isValidPublicKey(value) {
  try {
    const key = new PublicKey(value);
    return key.toBytes().length === 32 && key.toBase58() === value;
  } catch {
    return false;
  }
}

assert.equal(manifest.schemaVersion, '1.0.0');
assert.equal(manifest.network, 'solana-devnet');
assert.equal(typeof manifest.minimumBalanceLamports, 'number');
assert.ok(manifest.minimumBalanceLamports >= 0);
assert.ok(Array.isArray(manifest.profiles));
assert.equal(manifest.profiles.length, 5, 'manifest must publish first five specialist wallets');

const ids = new Set();
const publicKeys = new Set();
for (const profile of manifest.profiles) {
  assert.equal(typeof profile.profileId, 'string');
  assert.match(profile.profileId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(typeof profile.displayName, 'string');
  assert.ok(profile.displayName.length > 0);
  assert.equal(typeof profile.publicKey, 'string');
  assert.ok(isValidPublicKey(profile.publicKey), `${profile.profileId} publicKey must be a strict Solana public key`);
  assert.equal(profile.privateKey, undefined, `${profile.profileId} must not include privateKey`);
  assert.equal(profile.secretKey, undefined, `${profile.profileId} must not include secretKey`);
  assert.equal(profile.mnemonic, undefined, `${profile.profileId} must not include mnemonic`);
  assert.ok(!ids.has(profile.profileId), `duplicate profileId ${profile.profileId}`);
  assert.ok(!publicKeys.has(profile.publicKey), `duplicate publicKey ${profile.publicKey}`);
  ids.add(profile.profileId);
  publicKeys.add(profile.publicKey);
}

console.log(`wallet manifest valid: ${manifest.profiles.length} ${manifest.network} public keys, no secrets`);
