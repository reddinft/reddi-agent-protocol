import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateSignerBackedManifest } from '../dist/src/wallet-provenance.js';

const args = new Set(process.argv.slice(2).filter((arg) => arg.startsWith('--')));
const manifestPath = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? join(process.cwd(), 'public/wallet-manifest.json');
const requireSignerProvenance = args.has('--require-signer-provenance');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const errors = validateSignerBackedManifest(manifest, { requireSignerProvenance });
assert.deepEqual(errors, [], `wallet manifest failed validation:\n- ${errors.join('\n- ')}`);
assert.equal(manifest.profiles.length, 5, 'manifest must publish first five specialist wallets');

console.log(`wallet manifest valid: ${manifest.profiles.length} ${manifest.network} public keys, no secrets${requireSignerProvenance ? ', signer provenance present' : ''}`);
