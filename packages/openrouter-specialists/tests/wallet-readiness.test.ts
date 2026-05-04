import assert from "node:assert/strict";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import { specialistProfiles } from "../src/profiles/index.js";
import { buildWalletReadinessReport } from "../src/wallet-readiness.js";
import { buildSignerBackedWalletManifest, type LoadedSignerProfile } from "../src/wallet-provenance.js";
import type { SpecialistProfile } from "../src/types.js";

function cloneProfiles(): SpecialistProfile[] {
  return specialistProfiles.map((profile) => ({ ...profile, capabilities: [...profile.capabilities], roles: [...profile.roles], preferredAttestors: [...profile.preferredAttestors], tags: [...profile.tags] }));
}

function signerLoadedForProfile(profiles: SpecialistProfile[], index: number): LoadedSignerProfile {
  const profile = profiles[index];
  assert.ok(profile);
  const keypair = Keypair.generate();
  profile.walletAddress = keypair.publicKey.toBase58();
  return { profile, keypair, sourceEnv: `OPENROUTER_SPECIALIST_${profile.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_SIGNER_KEYPAIR_JSON` };
}

test("wallet readiness blocks all profiles without signer-backed provenance", () => {
  const report = buildWalletReadinessReport({ generatedAt: "2026-05-04T00:00:00.000Z" });

  assert.equal(report.schemaVersion, "reddi.openrouter.wallet-readiness.v1");
  assert.equal(report.status, "blocked");
  assert.equal(report.profileCount, 30);
  assert.equal(report.signerBackedCount, 0);
  assert.equal(report.placeholderOrUnverifiedCount, 30);
  assert.equal(report.entries.length, 30);
  assert.equal(report.entries[0]?.firstFiveDeploymentProfile, true);
  assert.equal(report.entries[5]?.firstFiveDeploymentProfile, false);
  assert.ok(report.entries.every((entry) => !entry.fundingReady));
  assert.ok(report.entries.every((entry) => !entry.registrationReady));
  assert.ok(JSON.stringify(report).includes("placeholder_or_unverified wallets are not funding-ready"));
});

test("wallet readiness marks only signer-backed matching profiles as funding and registration ready", () => {
  const profiles = cloneProfiles();
  const loaded = [signerLoadedForProfile(profiles, 0), signerLoadedForProfile(profiles, 1)];
  const manifest = buildSignerBackedWalletManifest({ loaded, generatedAt: "2026-05-04T00:00:00.000Z" });
  const report = buildWalletReadinessReport({ profiles, signerBackedManifest: manifest, generatedAt: "2026-05-04T00:00:00.000Z" });

  assert.equal(report.status, "blocked");
  assert.equal(report.profileCount, 30);
  assert.equal(report.signerBackedCount, 2);
  assert.equal(report.placeholderOrUnverifiedCount, 28);
  assert.equal(report.entries[0]?.provenance, "signer_backed");
  assert.equal(report.entries[0]?.fundingReady, true);
  assert.equal(report.entries[0]?.registrationReady, true);
  assert.equal(report.entries[2]?.provenance, "placeholder_or_unverified");
  assert.equal(report.entries[2]?.fundingReady, false);
  assert.equal(report.entries[2]?.registrationReady, false);
});

test("wallet readiness blocks signer-backed public keys that do not match profile wallets", () => {
  const profiles = cloneProfiles();
  const profile = profiles[0];
  assert.ok(profile);
  const manifest = buildSignerBackedWalletManifest({
    loaded: [{ profile, keypair: Keypair.generate(), sourceEnv: "OPENROUTER_SPECIALIST_PLANNING_AGENT_SIGNER_KEYPAIR_JSON" }],
    generatedAt: "2026-05-04T00:00:00.000Z",
  });
  const report = buildWalletReadinessReport({ profiles, signerBackedManifest: manifest, generatedAt: "2026-05-04T00:00:00.000Z" });

  assert.equal(report.entries[0]?.provenance, "placeholder_or_unverified");
  assert.equal(report.entries[0]?.fundingReady, false);
  assert.ok(report.entries[0]?.blockers.includes("signer-backed public key does not match profile wallet"));
});
