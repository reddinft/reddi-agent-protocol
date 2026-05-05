#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, "config/quasar/deployments.json");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

const fail = (message) => {
  console.error(`[quasar-inventory] FAIL: ${message}`);
  process.exitCode = 1;
};

const isSolanaAddressLike = (value) =>
  typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

if (inventory.target !== "hackathon-demo-quasar-cutover") {
  fail("target must be hackathon-demo-quasar-cutover");
}

const legacy = inventory.legacyAnchorReference;
if (!legacy || !isSolanaAddressLike(legacy.programId)) {
  fail("legacyAnchorReference.programId must be present for explicit non-demo comparison");
}

const devnet = inventory.quasarDeployments?.devnet;
if (!devnet) {
  fail("quasarDeployments.devnet is required");
} else {
  if (devnet.cluster !== "devnet") fail("devnet.cluster must be devnet");
  if (!isSolanaAddressLike(devnet.programId)) fail("devnet.programId must be a valid-looking Solana address");
  if (devnet.programId === legacy?.programId) fail("Quasar devnet programId must not equal legacy Anchor programId");
  if (!Array.isArray(devnet.evidence) || devnet.evidence.length === 0) fail("devnet.evidence must include at least one proof artifact");
  if (!Array.isArray(devnet.knownGaps)) fail("devnet.knownGaps must be explicit, even when empty");
}

if (inventory.submissionReady === true && devnet?.knownGaps?.length) {
  fail("submissionReady cannot be true while knownGaps are present");
}

if (!process.exitCode) {
  console.log(`[quasar-inventory] OK: devnet Quasar candidate ${devnet.programId}; submissionReady=${inventory.submissionReady}`);
}
