import assert from "node:assert/strict";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import {
  buildSignerBackedWalletManifest,
  loadSignerKeypairsFromEnv,
  profileEnvSlug,
  redactSecrets,
  validateSignerBackedManifest,
} from "../src/wallet-provenance.js";
import type { SpecialistProfile } from "../src/types.js";

function profile(id: string): SpecialistProfile {
  return {
    id,
    displayName: id,
    description: "test",
    walletAddress: Keypair.generate().publicKey.toBase58(),
    endpointPath: "/v1/chat/completions",
    capabilities: ["test"],
    roles: ["specialist"],
    price: { currency: "USDC", amount: "0.01", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: [],
    model: "test-model",
    tags: [],
    systemPrompt: "test",
  };
}

test("profileEnvSlug converts profile IDs to per-profile env slugs", () => {
  assert.equal(profileEnvSlug("document-intelligence-agent"), "DOCUMENT_INTELLIGENCE_AGENT");
});

test("loads signer keypairs from env and renders public-only provenance manifest", () => {
  const profiles = [profile("planning-agent"), profile("code-generation-agent")];
  const planning = Keypair.generate();
  const code = Keypair.generate();
  const env = {
    OPENROUTER_SPECIALIST_SIGNER_KEYPAIRS_JSON: JSON.stringify({
      "planning-agent": Array.from(planning.secretKey),
    }),
    OPENROUTER_SPECIALIST_CODE_GENERATION_AGENT_SIGNER_KEYPAIR_JSON: JSON.stringify({
      secretKey: Array.from(code.secretKey),
    }),
  };

  const loaded = loadSignerKeypairsFromEnv({ env, profiles, requireAll: true });
  const manifest = buildSignerBackedWalletManifest({ loaded: loaded.loaded, generatedAt: "2026-05-04T00:00:00.000Z" });
  const serialized = JSON.stringify(manifest);

  assert.equal(manifest.profiles[0].publicKey, planning.publicKey.toBase58());
  assert.equal(manifest.profiles[0].signerProvenance.sourceEnv, "OPENROUTER_SPECIALIST_SIGNER_KEYPAIRS_JSON");
  assert.equal(manifest.profiles[1].publicKey, code.publicKey.toBase58());
  assert.equal(manifest.profiles[1].signerProvenance.sourceEnv, "OPENROUTER_SPECIALIST_CODE_GENERATION_AGENT_SIGNER_KEYPAIR_JSON");
  assert.ok(!serialized.includes(String(planning.secretKey[0]) + "," + String(planning.secretKey[1])));
  assert.deepEqual(validateSignerBackedManifest(manifest, { requireSignerProvenance: true }), []);
});

test("signer loading fails closed when required signer env is missing", () => {
  assert.throws(
    () => loadSignerKeypairsFromEnv({ env: {}, profiles: [profile("planning-agent")], requireAll: true }),
    /missing signer env/,
  );
});

test("provenance validation rejects secrets and missing signer provenance", () => {
  const manifest = {
    schemaVersion: "1.0.0",
    network: "solana-devnet",
    minimumBalanceLamports: 1,
    profiles: [
      {
        profileId: "planning-agent",
        displayName: "Planning Agent",
        publicKey: Keypair.generate().publicKey.toBase58(),
        secretKey: [1, 2, 3],
      },
    ],
  };

  const errors = validateSignerBackedManifest(manifest, { requireSignerProvenance: true });
  assert.ok(errors.some((error) => error.includes("secret-like field secretKey")));
  assert.ok(errors.some((error) => error.includes("missing signerProvenance")));
});

test("redactSecrets removes nested key material before logging", () => {
  assert.deepEqual(redactSecrets({ publicKey: "abc", secretKey: [1, 2, 3], nested: { privateKey: "nope" } }), {
    publicKey: "abc",
    secretKey: "[REDACTED]",
    nested: { privateKey: "[REDACTED]" },
  });
});
