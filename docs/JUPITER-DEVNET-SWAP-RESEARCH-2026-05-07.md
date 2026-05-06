# Jupiter Devnet Swap Research — 2026-05-07

## Question

Can the demo execute a successful Jupiter-routed token swap on Solana devnet?

## Short answer

No reliable pure-devnet Jupiter swap path was found. Jupiter's public Swap APIs produce mainnet-routed quotes/transactions and do not expose a devnet/testnet network selector. A transaction can be requested and signed by our devnet demo wallet, but the resulting account/program/table material targets mainnet liquidity and fails on devnet.

## Evidence checked

### Jupiter docs

- Jupiter docs describe Swap API V2 at `https://api.jup.ag/swap/v2` and legacy Metis Swap API at `https://api.jup.ag/swap/v1` / `https://lite-api.jup.ag/swap/v1`.
- The environment setup example initializes RPC with `https://api.mainnet-beta.solana.com`.
- The quote/build docs have no `cluster`, `network`, `devnet`, or `testnet` parameter.
- Swap V2 docs describe routing through Solana production liquidity engines/venues: Metis, JupiterZ RFQ, Dflow, OKX. The custom `/build` path is Metis-only but still production liquidity.

### Community/search evidence

- The clearest public answer found says Jupiter does not support devnet/testnet swaps; use simulation or mainnet execution instead.
- Other discussion points to devnet/local testing requiring mainnet-fork/simulation or a non-Jupiter devnet AMM because Jupiter's devnet deployment/liquidity is not comparable to mainnet.

### Local empirical check

Existing artifact:

- `artifacts/economic-demo-devnet-wallet-backed-jupiter-swap/20260506T161235Z/wallet-backed-jupiter-swap.json`

Result:

- Jupiter returned a quote + swap transaction.
- Our devnet demo wallet signed it.
- Devnet submission failed with: `invalid transaction: Transaction loads an address table account that doesn't exist`.

Follow-up probe on 2026-05-07:

- Devnet slot: `460520837`.
- Mainnet slot: `418000301`.
- Jupiter quote `contextSlot`: `418000302`, matching mainnet, not devnet.
- With `asLegacyTransaction=true`, Jupiter avoids ALTs, but the transaction still contains mainnet-only Jupiter/AMM/account material.
- Account existence checks:
  - `JUP6LkbZ...` on devnet exists only as a system account with `len=0`, not as the executable Jupiter program. On mainnet it is owned by the BPF loader and executable program data exists.
  - Mainnet USDC mint `EPjFWdd5...` on devnet exists only as a system account with `len=0`, not an SPL mint. On mainnet it is a Tokenkeg mint.
  - Invariant/route token accounts returned by Jupiter are missing on devnet and present on mainnet.

## Conclusion

A successful Jupiter-routed swap on Solana devnet is not currently achievable through public Jupiter APIs. The blocker is structural, not just a script bug:

1. Jupiter quotes are computed against mainnet liquidity.
2. Returned swap transactions reference mainnet AMM accounts, token accounts, mints, lookup tables, and/or Jupiter program state.
3. Devnet lacks the relevant executable program + liquidity/account graph.

## Demo options

Recommended path for the hackathon demo:

1. Keep devnet for Quasar-native protocol actions.
2. Show Jupiter as an explicitly labelled boundary/proof lane:
   - quote received;
   - wallet-specific transaction built;
   - demo wallet signed;
   - devnet rejection proves why the final settlement path does not claim fake Jupiter devnet execution.
3. If a live successful Jupiter swap is essential, run a tiny mainnet-beta swap with explicit Nissan approval, real funds, and a hard cap. This would be honest and judge-visible, but it would be mainnet, not devnet.

Fallback alternatives:

- Use a local/Surfpool/mainnet-fork rehearsal if the demo needs a successful simulated swap-like step without spending real funds.
- Use a devnet-native AMM/Raydium-style fixture if the demo only needs "a swap happened on devnet", but do not brand it as Jupiter.
