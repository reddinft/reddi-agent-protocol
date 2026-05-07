# RAP MCP Bridge Schemas — Draft v0

_Date: 2026-05-08 AEST_

Purpose: define the durable objects that the MCP bridge should expose between generic agent runtimes and Reddi Agent Protocol. These are intentionally host-neutral and can wrap current RAP planner/registry records.

## Naming convention

External MCP tools use `reddi.*` names. Schema objects use `reddi.<object>.v1` schema versions.

## `ReddiSpecialistCandidate`

Returned by `reddi.discover_specialists`.

```ts
type ReddiSpecialistCandidate = {
  schemaVersion: "reddi.specialist_candidate.v1";
  specialistId: string;
  walletAddress: string;
  endpointUrl?: string;
  displayName?: string;
  description?: string;
  capabilities: {
    taskTypes: string[];
    inputModes: string[];
    outputModes: string[];
    privacyModes: string[];
    runtimeCapabilities: string[];
    tags: string[];
  };
  pricing: {
    baseUsd: number;
    perCallUsd: number;
    currencyPreference?: string;
    networkPreference?: string;
  };
  trust: {
    healthStatus: "pass" | "fail" | "unknown";
    freshnessState?: "fresh" | "warm" | "stale" | "unknown";
    attested: boolean;
    reputationScore: number;
    avgFeedbackScore: number;
    feedbackCount?: number;
    capabilityHash?: string | null;
  };
  selectionReasons: string[];
};
```

## `ReddiQuote`

Binding or semi-binding commercial terms for one specialist call.

MVP may synthesize this from registry pricing + x402 challenge. Production should bind it with specialist signature or server-side quote id.

```ts
type ReddiQuote = {
  schemaVersion: "reddi.quote.v1";
  quoteId: string;
  createdAt: string;
  expiresAt: string;
  quoteStatus: "draft" | "active" | "expired" | "cancelled";
  /** Who authored the quote. First PR only emits bridge_synthetic. */
  quoteAuthority: "bridge_synthetic" | "backend" | "specialist_signed";
  /** Whether terms are commercially binding. First PR synthetic quotes are always false. */
  binding: boolean;
  specialist: {
    specialistId: string;
    walletAddress: string;
    endpointUrl: string;
  };
  consumer?: {
    walletAddress?: string;
    agentName?: string;
    framework?: "openclaw" | "openswarm" | "cursor" | "claude" | "codex" | "custom";
  };
  task: {
    taskHash: string;
    taskSummary: string;
    taskTypeHint?: string;
    payloadClass: "prompt" | "file_summary" | "structured_json" | "private_reference";
  };
  terms: {
    amount: string;
    currency: string;
    network: "solana-devnet" | "solana-testnet" | "solana-mainnet-beta" | "local" | "demo";
    maxLatencyMs?: number;
    requiredEvidence: string[];
    privacyMode: "public" | "per" | "vanish";
    outputSchema?: string;
  };
  x402: {
    required: boolean;
    challengeHeader?: string;
    challengeUrl?: string;
    payTo?: string;
    nonce?: string;
  };
  termsHash: string;
  signature?: {
    signer: string;
    algorithm: string;
    value: string;
  };
};
```

## `ReddiPaymentIntent`

Pre-payment object created after policy approval but before settlement.

```ts
type ReddiPaymentIntent = {
  schemaVersion: "reddi.payment_intent.v1";
  paymentIntentId: string;
  quoteId: string;
  createdAt: string;
  payerWallet: string;
  approval: {
    mode: "dry_run" | "manual" | "session_budget" | "allowlist";
    approved: boolean;
    approvedBy?: "human" | "policy";
    budgetRemainingUsd?: number;
  };
  idempotencyKey: string;
};
```

## `ReddiPaymentReceipt`

Normalized payment result. MVP may support controlled demo receipts. Production must verify real network receipts before setting `verified=true`.

```ts
type ReddiPaymentReceipt = {
  schemaVersion: "reddi.payment_receipt.v1";
  paymentId: string;
  paymentIntentId: string;
  quoteId: string;
  createdAt: string;
  mode: "dry_run" | "controlled_demo" | "devnet" | "mainnet";
  status: "not_paid" | "submitted" | "confirmed" | "failed";
  payerWallet?: string;
  payeeWallet: string;
  amount: string;
  currency: string;
  network: string;
  nonce?: string;
  txSignature?: string;
  x402Header?: string;
  termsHash: string;
  verified: boolean;
  verificationBoundary: "none" | "demo_only" | "devnet_receipt" | "mainnet_receipt";
};
```

## `ReddiSpecialistRunReceipt`

Returned by `reddi.invoke_paid_specialist`.

```ts
type ReddiSpecialistRunReceipt = {
  schemaVersion: "reddi.specialist_run_receipt.v1";
  runId: string;
  quoteId?: string;
  paymentId?: string;
  createdAt: string;
  completedAt?: string;
  specialistWallet: string;
  endpointUrl?: string;
  taskHash: string;
  termsHash?: string;
  outputHash?: string;
  status: "completed" | "failed" | "blocked";
  x402: {
    required: boolean;
    challengeSeen: boolean;
    paymentAttempted: boolean;
    paymentSatisfied: boolean;
    txSignature?: string;
    receiptNonce?: string;
  };
  disclosure: {
    required: boolean;
    ledgerEntryId?: string;
  };
  trace: string[];
  safePublicEvidenceOnly: true;
};
```

## `ReddiReceiptVerificationResult`

Returned by `reddi.verify_receipt`.

```ts
type ReddiReceiptVerificationResult = {
  schemaVersion: "reddi.receipt_verification_result.v1";
  runId?: string;
  quoteId?: string;
  paymentId?: string;
  verified: boolean;
  boundary: "dry_run" | "controlled_demo" | "devnet" | "mainnet";
  checks: {
    quoteExists: "pass" | "fail" | "not_applicable";
    quoteUnexpired: "pass" | "fail" | "not_applicable";
    termsHash: "pass" | "fail" | "not_applicable";
    specialistIdentity: "pass" | "fail" | "not_applicable";
    paymentReceipt: "pass" | "fail" | "pending" | "not_applicable";
    outputHash: "pass" | "fail" | "pending" | "not_applicable";
    disclosureLedger: "pass" | "fail" | "pending" | "not_applicable";
    attestation: "pass" | "fail" | "pending" | "not_applicable";
  };
  evidence: Array<{
    type: "quote" | "tx" | "run" | "hash" | "ledger" | "attestation";
    value: string;
    public: boolean;
  }>;
  warnings: string[];
};
```

## `ReddiDisclosureLedger`

Parent-run evidence object. Compatible with existing `reddi.downstream-disclosure-ledger.v1` direction.

```ts
type ReddiDisclosureLedger = {
  schemaVersion: "reddi.downstream-disclosure-ledger.v1";
  generatedAt: string;
  parentRunId?: string;
  host: {
    framework: "openclaw" | "openswarm" | "cursor" | "claude" | "codex" | "custom";
    agentName?: string;
  };
  entries: ReddiDisclosureLedgerEntry[];
};

type ReddiDisclosureLedgerEntry = {
  entryId: string;
  runId: string;
  quoteId?: string;
  paymentId?: string;
  specialistWallet: string;
  capability: string;
  payloadClass: "prompt" | "file_summary" | "structured_json" | "private_reference";
  payloadHash?: string;
  outputHash?: string;
  amount?: string;
  currency?: string;
  network?: string;
  paymentReceiptHash?: string;
  verificationStatus: "not_required" | "pending" | "verified" | "failed";
  evidenceRefs: string[];
  safePublicEvidenceOnly: true;
};
```

## Loop 1 schema decisions

1. Quote is now first-class. It should not be hidden inside invoke.
2. Verification boundary is explicit: `dry_run`, `controlled_demo`, `devnet`, `mainnet`.
3. Terms are hash-bound before payment/invocation.
4. Disclosure ledger is an output of every paid specialist run, not a later report-only artifact.
5. MCP host/framework is recorded for evidence and growth analytics, but it must not affect trust by itself.

## Loop 5 safety revisions

- `ReddiQuote` now has `quoteAuthority` and `binding` fields.
- First implementation PR may only emit `quoteAuthority="bridge_synthetic"` and `binding=false`.
- `verified=true` must mean every requested/applicable check passes inside the declared boundary.
- Dry-run/synthetic quote verification may pass quote and terms checks, but payment settlement checks must be `not_applicable` or `pending`, never `pass`.
- First PR must reject `payloadClass="private_reference"` and must not persist raw prompts, raw outputs, secrets, x402 headers, endpoint auth headers, or sensitive nonces.
- Hashing must use canonical JSON with stable recursive key ordering, NFC string normalization, no undefined values, normalized money strings, uppercased currency, lowercased network, and exclusion of `quoteId`, `createdAt`, `expiresAt` from `termsHash` unless they are explicitly commercial terms.
