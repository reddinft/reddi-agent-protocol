# Capability Hash Linkage — Design Spec

_Date: 2026-04-17_

## Problem

The on-chain `AgentAccount` PDA has no pointer to capability metadata.
A consumer can see: wallet, reputation, model string, attestation accuracy.
They CANNOT verify: task types, pricing, endpoint URL, privacy modes.

This means capability data is unverifiable — it lives off-chain with no integrity guarantee.

## Solution

Add a `metadata_uri` field to `AgentAccount` (32 bytes — SHA-256 hash of a JSON capability profile).
The canonical off-chain capability index stores the full profile.
Any client can verify: `sha256(off-chain JSON) == on-chain metadata_uri`.

---

## Phase 1 — Off-chain bridge (now, no program change needed)

We add a `capabilityHash` field to `SpecialistIndexEntry` that is computed and stored on every capability save.

**How:**
1. On `POST /api/onboarding/capabilities` — compute `sha256(JSON.stringify(canonical_profile))` and store alongside the profile.
2. Registry bridge exposes `capabilityHash` in `SpecialistListing`.
3. Consumers can independently verify by fetching the profile and recomputing.

This gives integrity WITHOUT a program change.

---

## Phase 2 — On-chain linkage (post-hackathon program extension)

Extend `AgentAccount`:
```rust
pub metadata_uri: [u8; 32],  // sha256 of canonical capability JSON
```

Add instruction `update_metadata_uri(ctx, hash: [u8; 32])`:
- Signer must be account owner.
- Stores hash on-chain.

Then the flow is:
1. Specialist publishes capability profile → system computes hash.
2. Specialist signs `update_metadata_uri` → hash stored on-chain.
3. Any consumer: `sha256(capability_json) == agent.metadata_uri` → verified.

This is the final trust primitive: **on-chain capability attestation without a centralized index.**

---

## Canonical Profile Format (for hash stability)

```json
{
  "version": "1",
  "walletAddress": "<base58>",
  "taskTypes": ["summarize", "classify"],
  "inputModes": ["text"],
  "outputModes": ["text", "json"],
  "privacyModes": ["public", "per"],
  "pricing": { "baseUsd": 0, "perCallUsd": 0.001 },
  "tags": ["nlp", "fast"],
  "updatedAt": "<ISO 8601 — excluded from hash computation>"
}
```

**Hash stability rules:**
- Keys sorted alphabetically before stringify.
- `updatedAt` excluded from hash (mutable field).
- Array elements sorted before stringify.
- No trailing whitespace.

---

## Phase 1 implementation plan (immediate)

1. Update `lib/onboarding/capabilities.ts` — add `computeCapabilityHash()` helper.
2. Update `POST /api/onboarding/capabilities` — store hash alongside record.
3. Update `lib/onboarding/specialist-index.ts` — include hash in index entry.
4. Update `lib/registry/bridge.ts` — expose hash in `SpecialistListing`.
5. Expose hash in `GET /api/registry` response.
6. Specialist dashboard shows hash for manual verification.

Phase 2 (program extension) blocked on: `update_metadata_uri` instruction in Anchor program.
