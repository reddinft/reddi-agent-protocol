# Economic Demo Upfront Payment Evidence

Generated: 2026-05-07T08:18:02.475Z
Source: `artifacts/economic-demo-surfpool-rehearsal/20260507T081756Z/summary.json`

## What this proves

- User funds orchestrator first: **true**
- Upfront funding: **3.33125 USDC** (3331250 local lamports-equivalent)
- Downstream transfer count: **3**
- Protocol rail fee: **1250 lamports** (5 bps → reddi-protocol-treasury)
- Protocol fee matches expected bps: **true**
- Specialist credits match downstream transfers: **true**
- Upfront covers downstream budget + protocol fee: **true**
- Orchestrator retains positive markup after fees: **true**
- Blocked transfer balance mutation: **0**

## Jupiter route

- 0.021 SOL → 3.33125 USDC
- Slippage cap: 75 bps
- Status: quoted_not_executed
- Live quote proof: 0.042 SOL → 3.726188 USDC across 1 route leg(s)
- Devnet USDC receipt verification: blocked

## Limitations

- Surfpool/local proof demonstrates transaction ordering and budget math before devnet/live mutation.
- USDC is represented by deterministic lamports-equivalent accounting in this local rehearsal artifact.
- SOL→USDC Jupiter route is quoted/not executed in this local proof pack.
- Live Jupiter quote proves current route availability only; no swap/signature is claimed.
