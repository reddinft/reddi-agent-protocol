#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const perLib = path.join(repoRoot, 'experiments/quasar-escrow-per/src/lib.rs');
const baseLib = path.join(repoRoot, 'experiments/quasar-escrow/src/lib.rs');

const REQUIRED_CALLBACK = [196, 28, 41, 206, 48, 37, 51, 167];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseInstructionDiscriminators(source) {
  const matches = [...source.matchAll(/#\[instruction\(discriminator\s*=\s*([^\)]+)\)\]/g)];
  return matches.map((match) => {
    const raw = match[1].trim();
    if (!raw.startsWith('[') || !raw.endsWith(']')) {
      return { raw, values: null };
    }
    const values = raw
      .slice(1, -1)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number.parseInt(part, 10));
    return { raw, values };
  });
}

function sameBytes(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

const perSource = read(perLib);
const baseSource = read(baseLib);
const perDiscriminators = parseInstructionDiscriminators(perSource);
const baseDiscriminators = parseInstructionDiscriminators(baseSource);

let failed = false;

if (perDiscriminators.length === 0) {
  console.error('[quasar-per-abi] no PER instruction discriminators found');
  failed = true;
}

for (const discriminator of perDiscriminators) {
  if (!discriminator.values) {
    console.error(`[quasar-per-abi] PER discriminator must be byte-array form: ${discriminator.raw}`);
    failed = true;
    continue;
  }
  if (discriminator.values.length !== 8) {
    console.error(`[quasar-per-abi] PER discriminator must be 8 bytes: ${discriminator.raw}`);
    failed = true;
  }
  if (discriminator.values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    console.error(`[quasar-per-abi] PER discriminator contains non-byte value: ${discriminator.raw}`);
    failed = true;
  }
}

if (!perDiscriminators.some((d) => d.values && sameBytes(d.values, REQUIRED_CALLBACK))) {
  console.error(`[quasar-per-abi] missing MagicBlock undelegate callback discriminator: [${REQUIRED_CALLBACK.join(', ')}]`);
  failed = true;
}

if (!perSource.includes('mod quasar_escrow_per_poc')) {
  console.error('[quasar-per-abi] PER program module name missing');
  failed = true;
}

if (perSource.includes('declare_id!("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW")')) {
  console.error('[quasar-per-abi] PER program must not reuse the base Quasar escrow program ID');
  failed = true;
}

if (!baseDiscriminators.some((d) => d.raw === '0') || !baseDiscriminators.some((d) => d.raw === '1') || !baseDiscriminators.some((d) => d.raw === '2')) {
  console.error('[quasar-per-abi] base reusable escrow no longer exposes expected single-byte discriminators 0/1/2');
  failed = true;
}

if (baseSource.includes('undelegate_callback') || baseSource.includes('[196, 28, 41, 206, 48, 37, 51, 167]')) {
  console.error('[quasar-per-abi] base reusable escrow was polluted with MagicBlock PER callback code');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log(`[quasar-per-abi] OK: ${perDiscriminators.length} PER instructions use 8-byte discriminators; base escrow remains reusable single-byte ABI`);
