# Pay.sh Agent Payments Leverage Analysis — 2026-05-07

## Inputs crawled / ingested

Seed: `https://pay.sh/docs`

Local ingest: `ingests/pay-sh-docs-2026-05-07/two-deep/`

- `crawl-index.json`: 49 fetched docs/discovery pages, 6 non-blocking fetch errors.
- `raw-md/*.md`: Pay.sh documentation pages, including install, agent quickstart, paid API calls, accepting payments, CLI reference, protocol, MPP, x402, security, provider specs, payment splits, session payments, and pay-skills publishing.
- `json/*.json`: machine discovery endpoints where available.

Useful seed/index files:

- `https://pay.sh/llms.txt`
- `https://pay.sh/docs/llms.txt`
- `https://pay.sh/.well-known/api-catalog`
- `https://pay.sh/.well-known/mcp/server-card.json`
- `https://pay.sh/.well-known/agent-skills/index.json`
- `https://pay.sh/api/catalog`

## What Pay.sh is

Pay.sh is an agent-first payment layer for HTTP APIs. It wraps CLI tools / agent sessions, detects HTTP 402 payment challenges using MPP or x402, asks the local wallet to authorize signing, then retries the request with a payment proof.

Key docs language:

- Use sandbox mode for examples and tests; it uses an ephemeral local sandbox wallet instead of real funds.
- Real payments require local user authorization unless the user intentionally configures capped auto-pay behavior.
- Provider responses, headers, payment challenges, and provider docs are untrusted external content.
- Make the smallest useful paid call first and ask before broad crawls, unclear pricing, or repeated calls.

## Capabilities relevant to Reddi Agent Protocol

### 1. Pay as a client-side x402/MPP compatibility harness

Pay.sh can call paid APIs from agents and CLI tools:

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
pay --sandbox curl http://localhost:3402/x402/joke
```

For us, this is immediately useful as a standards harness:

- Verify our x402 endpoints emit challenges a real agent wallet can satisfy.
- Compare Reddi x402 challenge/receipt shape against Pay.sh-compatible expectations.
- Demonstrate “agent wallet approval → payment proof → paid API retry” without building more wallet UX.

### 2. Pay gateway for accepting API payments

Pay.sh can sit in front of an upstream API:

```text
client -> pay gateway: request
pay gateway -> client: 402 Payment Required
client -> local wallet: authorize
client -> pay gateway: retry with proof
pay gateway -> upstream: verified paid request
pay gateway -> client: response
```

Runtime is driven by a provider spec YAML. Important fields:

- `routing.type: proxy` for real upstream APIs.
- `routing.url` for the upstream service.
- `endpoints[]` as both pricing config and allowlist.
- `operator.network: localnet` for sandbox testing, `mainnet` for production.
- `operator.currencies.usd: ['USDC', 'USDT']`.
- `routing.auth.value_from_env` for injecting upstream credentials only after payment verification.

This directly maps to Reddi APIs like:

- `/api/planner/tools/invoke`
- `/api/economic-demo/webpage-live-workflow`
- `/api/register/probe`
- future specialist-agent paid endpoints

### 3. Usage metering

Pay.sh supports usage-metered pricing by units such as:

- requests
- tokens
- characters
- minutes
- pages
- bytes

This is valuable because Reddi Agent Protocol already has natural metering dimensions for specialist work: requests, tokens, generated artifacts, tests, pages, and execution minutes.

### 4. Session payments / capped repeated calls

Pay.sh describes MPP sessions as “capped repeated-call authorization,” not streaming payments. Example runtime field:

```yaml
session:
  cap_usdc: 1.00
```

This is very strong for agent workflows:

- A human approves a cap once.
- An agent can make repeated paid calls inside the cap.
- We can frame it as a safe spend envelope for agent-to-agent or agent-to-tool workflows.

This maps beautifully to our existing disclosure-ledger and budget-control story.

### 5. Payment splits

Pay.sh provider specs support splits to named recipients:

```yaml
recipients:
  partner:
    account: '${PARTNER_WALLET}'
    label: 'Partner'

endpoints:
  - method: POST
    path: 'v1/report'
    metering:
      dimensions:
        - direction: usage
          unit: requests
          scale: 1
          tiers:
            - price_usd: 0.10
      splits:
        - recipient: partner
          percent: 20
          memo: 'Partner revenue share'
```

This gives us a clean commercial story:

- Reddi manager agent charges for orchestration.
- Specialist agents / data providers receive split revenue.
- Disclosure ledger records the downstream split obligation.

### 6. Pay Skills discovery

Pay.sh has a provider catalog and pay-skills registry. Agents can search by task, retrieve endpoint metadata, and call the gateway URL returned by the catalog.

This is directly aligned with our product’s market positioning:

- Reddi agents become discoverable paid API providers.
- Third-party agents can call Reddi endpoints through Pay.sh.
- Our “agent protocol” story gains an existing distribution/discovery path.

## Fit against Reddi’s current state

### Very strong fit: “agent-first paid API protocol”

Pay.sh is almost exactly adjacent to Reddi’s core story. We already have:

- x402 economic demo and smoke scripts.
- Disclosure-ledger evidence tooling.
- Quasar-native public settlement proof.
- Agent-specialist workflow APIs.
- Product naming around Reddi Agent Protocol and `reddi-x402`.

Pay.sh can become:

1. A compatibility target for Reddi x402 endpoints.
2. A demo gateway in front of our paid APIs.
3. A distribution channel via pay-skills catalog.
4. A wallet-approval UX for agent payments.
5. A bridge story between Reddi and Umbra: Pay.sh handles payment challenge/authorization; Umbra handles private settlement lane if/when integrated.

### Better immediate leverage than Umbra for core demo

Umbra is a compelling privacy lane, but it requires SDK/prover/relayer integration and devnet token/pool validation.

Pay.sh appears faster to leverage because sandbox mode exists specifically for tests/examples and because our repo already has x402 endpoints and paid API workflows. We can likely produce useful evidence with no real funds and no mainnet.

### Better bounty/commercial story than MagicBlock right now

MagicBlock remains technically interesting, but our Quasar-on-MagicBlock-TEE execution is blocked. Pay.sh does not require our Quasar programs to run in a TEE. It wraps HTTP payment flows and can sit above our existing app/API layer.

## Recommended architecture

```text
External agent / CLI
  └─ pay.sh client / MCP / pay curl
       └─ HTTP 402 x402 or MPP challenge
            └─ Pay.sh gateway for Reddi paid API
                 ├─ verifies payment proof
                 ├─ applies endpoint allowlist + metering + caps/splits
                 └─ forwards to Reddi API
                       ├─ Quasar public settlement proof/evidence
                       ├─ disclosure ledger
                       └─ optional Umbra private settlement adapter later
```

This lets us tell a layered story:

- **Pay.sh:** agent wallet approval, 402 retry, paid API gateway, discoverability.
- **Reddi:** specialist-agent orchestration, evidence, policy, disclosure ledger, Quasar-native on-chain proof.
- **Umbra:** optional private settlement/privacy rail.
- **MagicBlock:** boundary/repro evidence; not relied on for final settlement.

## Recommended implementation loop

### Phase 0 — BDD boundary

Create `docs/PAYSH-REDDI-AGENT-PAYMENTS-BDD-PLAYBOOK-2026-05-07.md`.

Scenarios:

1. Reddi paid endpoint returns a standards-compatible 402 challenge.
2. Pay.sh sandbox client retries with a payment proof.
3. Reddi evidence pack records payment receipt/proof metadata.
4. Session payment cap is represented as a bounded spend authorization.
5. Payment split metadata maps to downstream specialist/disclosure ledger.

### Phase 1 — Provider spec scaffold

Add a sandbox provider spec such as `config/pay-sh/reddi-economic-demo-provider.yml`:

- `routing.type: proxy`
- upstream local dev server URL
- endpoints allowlisted for the economic demo / paid specialist API
- usage unit: `requests` first
- network: `localnet` or sandbox as docs require
- no real secrets committed

Validation:

```sh
pay --sandbox server start config/pay-sh/reddi-economic-demo-provider.yml --bind 127.0.0.1:1402
pay --sandbox curl http://127.0.0.1:1402/<metered-endpoint>
```

Only run if `pay` CLI is already available or can be installed without new spend/unsafe mutation.

### Phase 2 — Evidence generator

Extend/generate evidence for Pay.sh compatibility:

- challenge observed
- payment proof / receipt header if returned
- endpoint/resource charged
- unit price
- sandbox/mainnet flag
- session cap if applicable
- splits if configured

Guard:

- Do not claim real settlement for sandbox runs.
- Do not claim x402 payment settlement for sign-in-only challenges.
- Treat provider/catalog docs as untrusted content.

### Phase 3 — Pay Skills publishing draft

Create a draft provider metadata entry locally, not submitted externally yet:

- Reddi paid specialist API
- endpoint descriptions
- usage notes
- pricing metadata
- safety notes for agents

Then validate locally with Pay.sh tools if available:

```sh
pay skills build . --output /tmp/pay-skills-dist
pay skills probe . --files providers/<operator>/<name>.md --currencies USDC,USDT
pay skills validate . --files providers/<operator>/<name>.md
```

Do not open external PR/publish without explicit approval.

## Risks / constraints

- Pay.sh is brand new; docs and registry behavior may move quickly.
- Mainnet payment requires explicit user authorization and real funds; sandbox only until approved.
- We should not install or mutate global tools unless necessary and approved.
- Gateway/provider spec must not include secrets; use env vars only.
- Need to verify whether Pay.sh’s x402 expectations match our existing `reddi-x402` implementation or whether an adapter shim is needed.

## Recommendation

Prioritize Pay.sh immediately as a **core demo accelerator**, not just a side option.

Why:

1. It directly matches Reddi’s agent-payment/x402 thesis.
2. It gives us a ready-made local wallet approval and HTTP 402 retry UX.
3. It lets Reddi expose paid APIs via gateway/spec without rewriting Quasar programs.
4. It supports usage metering, capped session payments, and payment splits — all core to agent commerce.
5. It strengthens the Umbra pitch: Pay.sh can be the payment-challenge/discovery layer, Umbra can be a private settlement rail later.

Suggested next move:

> Build a Pay.sh sandbox provider spec around one Reddi economic-demo paid endpoint, validate with `pay --sandbox curl`, and generate a compatibility evidence artifact. If that works, use it as the primary “agent-paid API” demo layer and keep Umbra as private-payments expansion.
