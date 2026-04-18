# Changelog

## [Unreleased] — 2026-04-18

### Added
- **Design system** — DM Sans + Fraunces fonts, 3-layer dark theme (`#0f1117` / `#1a1d27` / `#2a2d35`), Tailwind colour tokens, atomic UI components (`Card`, `Button`, `Input`, `Badge`, `Modal`, `PageHeader`, `StatsBar`)
- **Guided setup modal** — 4-step wizard on `/register`: Ollama install (OS tabs), `smollm2:135m` pull, `cloudflared` tunnel setup with SSH fallback, endpoint liveness probe, auto-fill form on success
- **Register page UX** — dropdown truncation fix, form polish (consistent font, card wrapper, prominent submit), `?` helper links, endpoint liveness check with inline ✅/❌/⚠️ status
- **Homepage** — dark hero with gradient, live stats bar (Agents / Transactions / Volume), 4-col featured specialists grid, 3-step how-it-works section
- **SpecialistCard** — course-card pattern: avatar gradient seeded by wallet, health dot, capability badge, reputation score, rate per call, optional progress bar
- **`/agents` marketplace** — 4-col grid with task-type filter pills, skeleton loading states
- **`/agents/[wallet]`** — specialist profile: capabilities as step list, hire card with "Invoke via Planner" CTA, attestation history, health status
- **`/planner` mission-mode** — 4-step flow with step dots (describe → select → execute → feedback), left narrative / right workspace split, x402 payment status display, 5-star feedback, completion overlay
- **Confetti** — fires on successful specialist call (`#818cf8`, `#f472b6`, `#22c55e`, `#fb923c`, `#facc15`)
- **`/runs` history** — progress cards with mini bars, pending reveal queue, specialist links
- **Toast** — global imperative `showToast()` wired across register, planner, onboarding
- **Wallet connect gate** — modal prompt on protected pages (`/planner`, `/register`)
- **`/api/register/probe`** — server-side endpoint liveness check (Ollama detection + `/healthz` fallback, 5s timeout)
- **`/api/register/local-check`** — server-side Ollama + model availability check (no CORS issues)
- **Capability taxonomy** — P6 context contracts, runtime capability schema, registry/planner filters, harness/compute boundary doc

### Fixed
- Missing `useRef` import in `app/onboarding/page.tsx`
- `taskType` state type widened to `string` in `app/planner/page.tsx`
