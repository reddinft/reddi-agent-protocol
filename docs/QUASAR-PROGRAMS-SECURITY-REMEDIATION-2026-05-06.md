# Quasar Programs — Security Audit Remediation Log

_Date:_ 2026-05-06 AEST  
_Source audit:_ `docs/QUASAR-PROGRAMS-SECURITY-AUDIT-2026-05-06.md`

## Status

This branch applies the safe immediate hardening items and explicitly keeps the architectural job-binding findings open until we implement a canonical job/escrow binding design.

## Fixed in this pass

- **HIGH-1 / LOW-1:** restored Quasar escrow `created_at` / `created_slot` from `Clock::get()` and reintroduced the seven-day payer cancel window.
- **LOW-4:** changed escrow release/cancel lamport movement to checked arithmetic.
- **HIGH-4:** added release overflow checks, LTO, and single codegen unit profiles to every standalone Quasar program workspace.
- **HIGH-5:** replaced placeholder Quasar registry/reputation/attestation `declare_id!` values with the canonical devnet IDs tracked in project status.
- **HIGH-6:** pinned `quasar-svm` dev dependency to lockfile commit `cf3c06a08a9009631d42d7942a574da1eac6104d`.
- **MEDIUM-1:** reject all-zero reputation commitments.
- **MEDIUM-2:** domain-separate reputation commitments with `score || salt || job_id || program_id`.
- **MEDIUM-4:** restrict reputation expiry to the recorded consumer or specialist.
- **CRITICAL-2 defense-in-depth:** reject attestation where `consumer == judge`, blocking trivial self-confirmation loops while full job binding remains open.
- **MEDIUM-6 partial:** added `third_party/quasar/VERSION.md` with vendor/audit/re-vendor notes. Exact upstream SHA remains a mainnet-readiness TODO.

## Still open / requires design work

- **CRITICAL-1 / CRITICAL-3 / CRITICAL-4 / MEDIUM-5:** rating and attestation PDAs are still keyed by caller-chosen `job_id`; full fix requires a canonical `JobAccount` or escrow-derived seed material.
- **HIGH-2:** payee dispute/claim path requires the same trustworthy job/attestation binding.
- **HIGH-3:** reputation laundering policy is still undecided; options are tombstone history PDA, cooldown, or stake burn.
- **HIGH-7:** three independent agent registries remain a benchmarking/deployment-shape risk; mainnet design should use a canonical registry or merge the programs.
- **LOW-3 / LOW-5:** user-facing fee economics and registration event consistency remain documentation/observability work.

## Mainnet gate

Do not present these Quasar programs as mainnet-ready until the open architectural items above are closed and independently re-reviewed.
