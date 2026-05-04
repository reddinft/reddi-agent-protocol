import assert from "node:assert/strict";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import { buildWalletRotationPlan } from "../src/wallet-rotation-plan.js";
import type { WalletManifest } from "../src/marketplace-client.js";
import type { SpecialistProfile } from "../src/types.js";

function profile(id: string, walletAddress = Keypair.generate().publicKey.toBase58()): SpecialistProfile {
  return {
    id,
    displayName: id,
    description: "test",
    walletAddress,
    endpointPath: "/v1/chat/completions",
    capabilities: ["test"],
    tags: ["test"],
    model: "openrouter/test",
    roles: ["specialist"],
    price: { currency: "USDC", amount: "0.01", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: ["verification-validation-agent"],
    systemPrompt: "test",
  };
}

function manifestFor(profiles: SpecialistProfile[]): WalletManifest {
  return {
    schemaVersion: "1.0.0",
    network: "solana-devnet",
    minimumBalanceLamports: 1_000_000,
    profiles: profiles.map((entry) => ({
      profileId: entry.id,
      displayName: entry.displayName,
      publicKey: entry.walletAddress,
    })),
  };
}

test("rotation plan blocks placeholder-only current wallets before funding approval", () => {
  const profiles = [profile("planning-agent"), profile("document-intelligence-agent")];
  const report = buildWalletRotationPlan({
    profiles,
    currentManifest: manifestFor(profiles),
    generatedAt: "2026-05-04T00:00:00.000Z",
  });

  assert.equal(report.status, "blocked");
  assert.equal(report.profileCount, 2);
  assert.equal(report.signerBackedCandidateCount, 0);
  assert.equal(report.candidateRotationRequiredCount, 0);
  assert.deepEqual(report.entries.map((entry) => entry.fundingReadyAfterRotation), [false, false]);
  assert.deepEqual(report.entries.map((entry) => entry.registrationReadyAfterRotation), [false, false]);
  assert.ok(report.entries.every((entry) => entry.actions.includes("generate_or_import_signer")));
  assert.ok(report.guardrails.includes("no devnet funding executed"));
  assert.ok(report.guardrails.includes("no private keys or signer material emitted"));
});

test("rotation plan requires profile and manifest rotation when signer-backed candidates differ", () => {
  const profiles = [profile("planning-agent"), profile("code-generation-agent")];
  const candidates = profiles.map((entry) => ({
    profileId: entry.id,
    displayName: entry.displayName,
    publicKey: Keypair.generate().publicKey.toBase58(),
    signerProvenance: { sourceEnv: "OPENROUTER_SPECIALIST_SIGNER_KEYPAIRS_JSON", derivedFromSigner: true },
  }));

  const report = buildWalletRotationPlan({
    profiles,
    currentManifest: manifestFor(profiles),
    candidateManifest: { schemaVersion: "1.0.0", network: "solana-devnet", profiles: candidates },
  });

  assert.equal(report.status, "blocked");
  assert.equal(report.signerBackedCandidateCount, 2);
  assert.equal(report.candidateRotationRequiredCount, 2);
  assert.ok(report.entries.every((entry) => entry.signerBacked));
  assert.ok(report.entries.every((entry) => entry.actions.includes("rotate_profile_and_manifest_wallet")));
  assert.ok(report.entries.every((entry) => entry.actions.includes("verify_signer_backed_readiness")));
  assert.ok(report.entries.every((entry) => !entry.fundingReadyAfterRotation));
});

test("rotation plan becomes funding-approval-ready only after signer/profile/manifest equality", () => {
  const walletA = Keypair.generate().publicKey.toBase58();
  const walletB = Keypair.generate().publicKey.toBase58();
  const profiles = [profile("planning-agent", walletA), profile("verification-validation-agent", walletB)];
  const candidateProfiles = profiles.map((entry) => ({
    profileId: entry.id,
    displayName: entry.displayName,
    publicKey: entry.walletAddress,
    signerProvenance: { sourceEnv: "OPENROUTER_SPECIALIST_SIGNER_KEYPAIRS_JSON", derivedFromSigner: true },
  }));

  const report = buildWalletRotationPlan({
    profiles,
    currentManifest: manifestFor(profiles),
    candidateManifest: { schemaVersion: "1.0.0", network: "solana-devnet", profiles: candidateProfiles },
  });

  assert.equal(report.status, "ready_for_operator_funding_approval");
  assert.equal(report.signerBackedCandidateCount, 2);
  assert.equal(report.candidateRotationRequiredCount, 0);
  assert.equal(report.profileManifestMismatchCount, 0);
  assert.ok(report.entries.every((entry) => entry.fundingReadyAfterRotation));
  assert.ok(report.entries.every((entry) => entry.registrationReadyAfterRotation));
  assert.ok(report.entries.every((entry) => entry.actions.includes("ready_for_operator_funding_approval")));
  assert.match(report.nextApprovalRequired.join("\n"), /Operator approval to fund/);
});

test("rotation plan blocks malformed signer candidate public keys", () => {
  const profiles = [profile("planning-agent")];
  const report = buildWalletRotationPlan({
    profiles,
    currentManifest: manifestFor(profiles),
    candidateManifest: {
      schemaVersion: "1.0.0",
      network: "solana-devnet",
      profiles: [{ profileId: profiles[0].id, publicKey: "not-a-public-key", signerProvenance: { derivedFromSigner: true } }],
    },
  });

  assert.equal(report.status, "blocked");
  assert.equal(report.signerBackedCandidateCount, 0);
  assert.ok(report.entries[0].actions.includes("generate_or_import_signer"));
});
