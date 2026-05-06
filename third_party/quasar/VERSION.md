# Vendored Quasar Framework Version

Vendored for the Quasar program parity ports used by the Colosseum Frontier demo.

- **Upstream:** https://github.com/blueshift-gg/quasar
- **Vendored date:** 2026-05-06 AEST
- **Audit note:** The security audit in `docs/QUASAR-PROGRAMS-SECURITY-AUDIT-2026-05-06.md` reviewed the framework safety surface used by these programs: PDA verification, owner/discriminator checks, `init` / `init_if_needed`, and `close` semantics.
- **Local modifications:** The workspace is narrowed to the crates required by the demo programs (`lang`, `derive`, `pod`, `spl`) and the workspace resolver is pinned to Solana SBF-compatible resolver 2.
- **Re-vendor procedure:** record the upstream commit SHA, diff local changes against upstream, run `bash scripts/run-quasar-program-tests.sh`, and update this file in the same commit.

> TODO before mainnet: replace this note with the exact upstream commit SHA used for the vendor snapshot or move the dependency to a pinned Cargo git/path source.
