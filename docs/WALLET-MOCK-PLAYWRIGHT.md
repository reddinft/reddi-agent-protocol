# Playwright Solana Wallet Simulation

Use this for wallet-gated UX tests and screenshot capture without a browser extension.

## How it works

- A test-only adapter (`Playwright Wallet`) is injected in `WalletProvider` when:
  - `NEXT_PUBLIC_ENABLE_PLAYWRIGHT_WALLET=true`
- Tests connect through wallet modal selection (no extension needed), exposing a deterministic public key:
  - `11111111111111111111111111111111`

## Files

- Adapter: `lib/wallet/playwright-wallet-adapter.ts`
- Provider wiring: `components/WalletProvider.tsx`
- Playwright helper: `e2e/helpers/wallet.ts`
- Example spec: `e2e/wallet-mock.spec.ts`

## Commands

Run wallet simulation tests:

```bash
npm run test:e2e:wallet
```

Run full e2e with wallet simulation enabled in web server:

```bash
npm run test:e2e
```

## Screenshot capture usage

In any Playwright spec:

```ts
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

await enableMockWallet(page);
await page.goto("/planner");
await connectMockWallet(page);
await page.screenshot({ path: "artifacts/playwright-wallet/planner-wallet.png", fullPage: true });
```

## Safety

- This mode is disabled by default.
- It only activates when `NEXT_PUBLIC_ENABLE_PLAYWRIGHT_WALLET=true`.
- Do not set that flag in production deployment environments.
