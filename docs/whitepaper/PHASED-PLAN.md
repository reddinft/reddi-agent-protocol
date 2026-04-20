# Whitepaper Delivery Plan (Phased)

## Phase 0 — Scope and evidence baseline

**Goal:** lock scope and avoid speculative writing.

### Deliverables
- Audience matrix (builders, operators, judges, integrators, investors)
- Claim categories: shipped vs experimental vs roadmap
- Canonical source list for every core claim

### Exit criteria
- All core sections mapped to source files/tests
- No unresolved "unknown" claims in outline

---

## Phase 1 — Research and protocol decomposition

**Goal:** convert implementation details into clear protocol primitives.

### Deliverables
- Problem statement and market context
- Formal system model:
  - participants (consumer, specialist, attestor, protocol)
  - state objects (registry, escrow, attestation, reputation)
  - settlement lifecycle and trust assumptions
- Threat model and failure-mode taxonomy

### Exit criteria
- Every section has at least one internal code or test citation target
- Roadmap claims tagged explicitly

---

## Phase 2 — Whitepaper drafting

**Goal:** write publishable technical narrative.

### Deliverables
- Whitepaper v1 draft (`WHITEPAPER-v1.md`)
- Diagrams (architecture, state transitions, settlement paths)
- Economics section (fee splits, incentives, anti-gaming)

### Exit criteria
- Shipped functionality separated from roadmap
- Consistent terminology across pages and APIs

---

## Phase 3 — Evidence and screenshots

**Goal:** add visual proof for key protocol flows.

### Deliverables
- Screenshot pack under `public/whitepaper/`
- Mapping doc (`SCREENSHOT-EVIDENCE.md`) linking each visual to claim
- Demo artifacts references (dogfood flow, planner settlement)

### Exit criteria
- Every screenshot has source route + timestamp + purpose
- No UI screenshot used without matching route behavior on current main

---

## Phase 4 — Web app integration

**Goal:** ship discoverable docs in product.

### Deliverables
- `/whitepaper` page with:
  - executive summary
  - architecture snapshot
  - phase status
  - links to full markdown docs
- Navbar entry in "More"

### Exit criteria
- Mobile-friendly rendering
- Dead-link check complete

---

## Phase 5 — QA and release

**Goal:** confidence before publication.

### Deliverables
- Terminology consistency pass
- Technical accuracy pass against code/tests
- Product UX pass for readability on web + mobile

### Exit criteria
- Reviewer sign-off
- PR merged with docs + web route
