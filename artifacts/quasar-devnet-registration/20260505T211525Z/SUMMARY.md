# Quasar Devnet Registration — Demo Agents A/B/C

- Target: Quasar Registry program `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Cluster/RPC: Solana devnet `https://api.devnet.solana.com`
- Status: A/B/C registered and read back successfully.

## Registration transactions

- Agent A: `iLudQFTyJ7c7mpzDxWMZaLEptmv1H3eM7NtfmSULLi6FTQKkaKvEJeE3hFn5Tf3YQEEvvhJcX7nvJucjyE8eghX`
- Agent B: `2KnvFgTm3ivqis5iFAxpyX4TkH1Zbyv2sfv975MtT6Be39kTy8mabRmf9jWXJekVY22NLKaR3cAb9dVsC8oFcFMi`
- Agent C: `46H43gGDZFvWL9oLzg1iNXTdweuihmbp9DH2fKhHdpeJKdxywUKsFdTkna8XxeyKeXhsZ53ykbPjLzQ9AotGGeS9`

## Readback

See `pda-readback.json`. Quasar PDAs exist for all three demo agents with data length `153` bytes, matching Quasar `AgentAccount` layout.

## Note

The earlier failed attempt targeted Quasar Escrow program `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW` for registry registration and failed with `insufficient account keys for instruction`. The fix is to treat Quasar as a multi-program deployment and use the registry program for `register_agent`/`deregister_agent`.
