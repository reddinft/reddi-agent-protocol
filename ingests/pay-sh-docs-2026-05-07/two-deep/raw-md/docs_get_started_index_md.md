# Get Started

> Install pay and choose the right first workflow for clients, agents, or servers.

Start with sandbox mode. It uses an ephemeral local sandbox wallet and avoids real funds while you verify the payment loop.

## Agent summary

- Use `pay --sandbox curl ...` for the smallest client proof.
- Use `pay --sandbox claude` or `pay --sandbox codex` when the agent should discover and call paid APIs.
- Use `pay --sandbox server demo` when testing the gateway side.
- Prefer linked docs pages over guessing flags from memory.

## First commands

```sh
brew install pay
pay --version
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

## Choose a path

- [Client quickstart](/docs/get-started/client-quickstart): call a paid API from a shell.
- [Agent quickstart](/docs/get-started/agent-quickstart): run an agent with Pay MCP tools.
- [Server quickstart](/docs/get-started/server-quickstart): start a local payment gateway.
