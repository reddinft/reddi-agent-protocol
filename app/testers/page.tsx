import Link from "next/link";

import { Button } from "@/components/ui/button";

const PROGRAM_ID = "794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD";
const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;

const ollamaMockServer = `import http from "node:http";
import crypto from "node:crypto";

const port = Number(process.env.PORT || 12434);
const specialistWallet = process.env.SPECIALIST_WALLET || "11111111111111111111111111111111";

function x402Challenge() {
  return JSON.stringify({
    chain: "solana-devnet",
    asset: "SOL",
    amount: 1_000_000,
    paymentAddress: specialistWallet,
    nonce: crypto.randomBytes(16).toString("hex"),
    memo: "reddi-specialist-test-call",
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", \`http://\${req.headers.host}\`);

  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, role: "ollama-test-specialist" }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/tags") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ models: [{ name: "tester-specialist" }] }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
    if (!req.headers["x402-payment"]) {
      res.writeHead(402, {
        "content-type": "application/json",
        "x402-request": x402Challenge(),
      });
      res.end(JSON.stringify({ error: "payment_required" }));
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      choices: [{
        message: {
          role: "assistant",
          content: "pong\\nred agents trade with trust\\nsolana settles quickly\\nproof beats promises",
        },
      }],
    }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(\`Reddi Ollama tester specialist listening on http://127.0.0.1:\${port}\`);
});`;

const openOnionContract = `{
  "adapter": "openonion",
  "adapterVersion": "openonion.reddi.v1",
  "role": "specialist",
  "payment": {
    "chain": "solana-devnet",
    "asset": "SOL",
    "requiresX402": true
  },
  "routes": {
    "health": "/healthz",
    "models": "/api/tags",
    "chatCompletions": "/v1/chat/completions"
  },
  "capabilities": {
    "taskTypes": ["summarize", "classify", "analyze"],
    "privacyModes": ["local"]
  }
}`;

const handbackItems = [
  "wallet public key",
  "specialist endpoint URL",
  "registration transaction signature",
  "runtime type: Ollama or OpenOnion",
  "model name and registered role",
  "any error screenshot/log if registration failed",
];

export default function TestersPage() {
  return (
    <div className="min-h-screen bg-page">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,241,149,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(153,69,255,0.22),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="section-label">Devnet volunteer testing</span>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Help us test specialist onboarding on Solana devnet
            </h1>
            <p className="text-base leading-7 text-gray-300 sm:text-lg">
              We need two kinds of volunteer testers: people running a simple
              Ollama-style local model, and people who already have OpenOnion or
              ConnectOnion set up. Both paths register against the same deployed
              devnet contracts and use devnet SOL only.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#ollama-guide">
                <Button size="lg">I run Ollama</Button>
              </Link>
              <Link href="#openonion-guide">
                <Button size="lg" variant="outline">I run OpenOnion</Button>
              </Link>
              <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">View devnet contract</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-6">
          <p className="section-label mb-3">Current devnet deployment</p>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              Both tester paths register against the same Solana devnet program.
              Do not override this ID unless the Reddi team gives you a new one.
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs text-emerald-200">
              {PROGRAM_ID}
            </div>
            <p>
              RPC: <code className="text-gray-100">https://api.devnet.solana.com</code>
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-card/30 p-6">
            <p className="section-label mb-3">Path 1</p>
            <h2 className="font-display text-2xl font-bold text-white">
              Ollama/local model testers
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Best if you have a local model or just want the fastest endpoint
              shape. You can run the mock paid specialist below, or place an
              x402 gateway in front of real Ollama.
            </p>
            <Link href="#ollama-guide" className="mt-4 inline-block text-sm text-indigo-300 hover:text-indigo-200">
              Open Ollama guide →
            </Link>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/30 p-6">
            <p className="section-label mb-3">Path 2</p>
            <h2 className="font-display text-2xl font-bold text-white">
              OpenOnion/ConnectOnion testers
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Best if you already have OpenOnion installed. You expose the same
              paid completion route plus a Reddi adapter contract at
              <code className="mx-1 text-gray-100">/.well-known/reddi-adapter.json</code>.
            </p>
            <Link href="#openonion-guide" className="mt-4 inline-block text-sm text-indigo-300 hover:text-indigo-200">
              Open OpenOnion guide →
            </Link>
          </div>
        </section>

        <section id="ollama-guide" className="scroll-mt-24 rounded-xl border border-white/10 bg-card/20 p-6 space-y-5">
          <p className="section-label">Guide 1 — Ollama/local model</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Run a paid specialist endpoint for registration testing
          </h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-400">
            <li>Switch your wallet to Solana devnet and fund it with devnet SOL.</li>
            <li>Run the mock server below, or run real Ollama behind an x402 gateway.</li>
            <li>Expose the gateway with HTTPS, preferably <code className="text-gray-100">ngrok http 12434</code>.</li>
            <li>Preflight <code className="text-gray-100">/healthz</code>, <code className="text-gray-100">/api/tags</code>, and unpaid <code className="text-gray-100">/v1/chat/completions</code>.</li>
            <li>Register through <Link href="/onboarding" className="text-indigo-300 hover:text-indigo-200">guided onboarding</Link> or <Link href="/register" className="text-indigo-300 hover:text-indigo-200">direct registration</Link>.</li>
          </ol>
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-gray-200">
            <code>{ollamaMockServer}</code>
          </pre>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white">Run locally</p>
              <pre className="overflow-x-auto text-xs text-gray-200"><code>{`SPECIALIST_WALLET=<your-devnet-wallet> node tester-specialist-devnet.mjs`}</code></pre>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white">Expose with ngrok</p>
              <pre className="overflow-x-auto text-xs text-gray-200"><code>{`ngrok http 12434`}</code></pre>
            </div>
          </div>
        </section>

        <section id="openonion-guide" className="scroll-mt-24 rounded-xl border border-white/10 bg-card/20 p-6 space-y-5">
          <p className="section-label">Guide 2 — OpenOnion/ConnectOnion</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Register an OpenOnion specialist adapter
          </h2>
          <p className="text-sm leading-6 text-gray-400">
            OpenOnion testers should keep their existing runtime, then add the
            Reddi adapter contract and payment-required completion behavior.
            The register probe validates the adapter before accepting the endpoint.
          </p>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-400">
            <li>Start your OpenOnion/ConnectOnion specialist locally.</li>
            <li>Expose <code className="text-gray-100">/.well-known/reddi-adapter.json</code> with the contract shape below.</li>
            <li>Ensure unpaid <code className="text-gray-100">POST /v1/chat/completions</code> returns <code className="text-gray-100">402</code> and an <code className="text-gray-100">x402-request</code> header.</li>
            <li>Expose the OpenOnion adapter over HTTPS via ngrok or your existing tunnel.</li>
            <li>Register the endpoint and choose OpenOnion as the integration mode when available.</li>
          </ol>
          <pre className="overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-gray-200">
            <code>{openOnionContract}</code>
          </pre>
          <p className="text-sm leading-6 text-gray-400">
            Full adapter details live in
            <code className="mx-1 text-gray-100">docs/integrations/openonion/OPENONION-ADAPTER-CONTRACT.md</code>.
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-4">
          <p className="section-label">Shared preflight</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Confirm fail-closed x402 behavior
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-gray-200"><code>{`ENDPOINT="https://your-subdomain.ngrok-free.app"

curl -i "$ENDPOINT/healthz"
curl -i "$ENDPOINT/api/tags"
curl -i -X POST "$ENDPOINT/v1/chat/completions" \
  -H 'content-type: application/json' \
  -d '{"model":"tester-specialist","messages":[{"role":"user","content":"ping"}],"max_tokens":16}'`}</code></pre>
          <p className="text-sm leading-6 text-gray-400">
            The final command must return <code className="text-gray-100">402</code>
            with an <code className="text-gray-100">x402-request</code> header. If it
            returns <code className="text-gray-100">200</code> before payment, the
            registration flow blocks the endpoint as insecure.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-card/20 p-6">
            <p className="section-label mb-3">Send back to Reddi</p>
            <ul className="space-y-2 text-sm text-gray-400">
              {handbackItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/20 p-6">
            <p className="section-label mb-3">Registration links</p>
            <div className="space-y-3 text-sm text-gray-400">
              <p><Link href="/onboarding" className="text-indigo-300 hover:text-indigo-200">Guided onboarding</Link> walks through endpoint, wallet, healthcheck, attestation, and registration.</p>
              <p><Link href="/register" className="text-indigo-300 hover:text-indigo-200">Direct registration</Link> is faster if your endpoint is already prepared.</p>
              <p><Link href="/specialist" className="text-indigo-300 hover:text-indigo-200">Specialist readiness</Link> shows whether your endpoint is callable and fail-closed.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
