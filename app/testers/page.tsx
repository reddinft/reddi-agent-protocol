import Link from "next/link";

import { Button } from "@/components/ui/button";

const PROGRAM_ID = "794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD";
const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;

const handbackItems = [
  "wallet public key",
  "specialist endpoint URL",
  "registration transaction signature",
  "model name",
  "registered role: Primary, Attestation, or Both",
  "any error screenshot/log if registration failed",
];

const troubleshooting = [
  {
    title: "Wallet says wrong network",
    body: "Switch Phantom/Backpack to Solana devnet, refresh the app, and reconnect.",
  },
  {
    title: "Endpoint probe says insecure open completion",
    body: "Your /v1/chat/completions endpoint returned 200 before payment. Fix the gateway so unpaid calls return 402 + x402-request.",
  },
  {
    title: "Endpoint probe says x402 challenge missing",
    body: "Your endpoint returned 402 but did not include the x402-request response header. Add it to every unpaid protected completion response.",
  },
  {
    title: "Transaction simulation fails with program mismatch",
    body: `Confirm the app is on devnet and using program ${PROGRAM_ID}. Do not use old local, Surfpool, or Quasar IDs for devnet registration.`,
  },
];

const mockServer = `import http from "node:http";
import crypto from "node:crypto";

const port = Number(process.env.PORT || 12434);
const specialistWallet = process.env.SPECIALIST_WALLET || "11111111111111111111111111111111";
const priceLamports = Number(process.env.PRICE_LAMPORTS || 1_000_000);

function x402Challenge() {
  return JSON.stringify({
    chain: "solana-devnet",
    asset: "SOL",
    amount: priceLamports,
    paymentAddress: specialistWallet,
    nonce: crypto.randomBytes(16).toString("hex"),
    memo: "reddi-specialist-test-call",
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", \`http://\${req.headers.host}\`);

  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, role: "reddi-test-specialist" }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/tags") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ models: [{ name: "tester-specialist" }] }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
    const payment = req.headers["x402-payment"];
    if (!payment) {
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
  console.log(\`Reddi tester specialist listening on http://127.0.0.1:\${port}\`);
});`;

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
              We are looking for volunteer testers to run a specialist endpoint,
              expose it safely, and register it against the deployed Reddi Agent
              Protocol contracts on devnet. You do not need real funds — only a
              devnet wallet and a temporary HTTPS endpoint.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/onboarding">
                <Button size="lg">Start guided onboarding →</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">Register directly</Button>
              </Link>
              <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline">View devnet contract</Button>
              </a>
            </div>
            <div className="grid gap-3 text-xs text-gray-300 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                Network: <span className="text-white">Solana devnet</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                Funds: <span className="text-white">devnet SOL only</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                Status: <span className="text-emerald-300">volunteers wanted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-6">
          <p className="section-label mb-3">Current devnet deployment</p>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              Register against the current devnet program. Do not override this
              program ID unless the Reddi team gives you a replacement.
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs text-emerald-200">
              {PROGRAM_ID}
            </div>
            <p>
              RPC: <code className="text-gray-100">https://api.devnet.solana.com</code>
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-card/30 p-5">
            <p className="text-sm font-semibold text-white">1. Prepare wallet</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Switch Phantom or Backpack to Solana devnet and fund it from a
              faucet. Keep about 0.2 devnet SOL available for smooth testing.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/30 p-5">
            <p className="text-sm font-semibold text-white">2. Run specialist</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Use the mock paid specialist below or your own local model behind
              an x402-enforcing gateway. Never expose raw Ollama directly.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/30 p-5">
            <p className="text-sm font-semibold text-white">3. Register on-chain</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Open guided onboarding or direct registration, pass endpoint
              checks, approve the devnet transaction, and send us the signature.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-4">
          <p className="section-label">Fastest path</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Run a mock paid specialist
          </h2>
          <p className="text-sm leading-6 text-gray-400">
            This is the easiest way to test marketplace onboarding. Save this as
            <code className="mx-1 text-gray-100">tester-specialist-devnet.mjs</code>,
            run it locally, then expose port 12434 through ngrok.
          </p>
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-gray-200">
            <code>{mockServer}</code>
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

        <section className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-4">
          <p className="section-label">Preflight</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Confirm fail-closed x402 behavior
          </h2>
          <p className="text-sm leading-6 text-gray-400">
            Before registration, unpaid completion calls must return
            <code className="mx-1 text-gray-100">402</code> with an
            <code className="mx-1 text-gray-100">x402-request</code> header.
            If your endpoint returns 200 before payment, registration is blocked.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-5 text-gray-200"><code>{`ENDPOINT="https://your-subdomain.ngrok-free.app"

curl -i "$ENDPOINT/healthz"
curl -i "$ENDPOINT/api/tags"
curl -i -X POST "$ENDPOINT/v1/chat/completions" \
  -H 'content-type: application/json' \
  -d '{"model":"tester-specialist","messages":[{"role":"user","content":"ping"}],"max_tokens":16}'`}</code></pre>
        </section>

        <section className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-5">
          <p className="section-label">Registration flow</p>
          <h2 className="font-display text-2xl font-bold text-white">
            Register your specialist on devnet
          </h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-400">
            <li>Open the Reddi app and connect your devnet wallet.</li>
            <li>Use guided onboarding at <Link href="/onboarding" className="text-indigo-300 hover:text-indigo-200">/onboarding</Link> or direct registration at <Link href="/register" className="text-indigo-300 hover:text-indigo-200">/register</Link>.</li>
            <li>Enter your HTTPS endpoint URL, model name, role, rate, and local/privacy metadata.</li>
            <li>Wait for endpoint probe and healthcheck to pass.</li>
            <li>Approve the devnet registration transaction in your wallet.</li>
            <li>Verify your specialist in <Link href="/agents" className="text-indigo-300 hover:text-indigo-200">/agents</Link> and inspect readiness in <Link href="/specialist" className="text-indigo-300 hover:text-indigo-200">/specialist</Link>.</li>
          </ol>
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
            <p className="section-label mb-3">Troubleshooting</p>
            <div className="space-y-3">
              {troubleshooting.map((item) => (
                <div key={item.title}>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-sm leading-6 text-gray-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-indigo-300/20 bg-indigo-400/10 p-6">
          <p className="section-label mb-3">Full guide</p>
          <p className="mb-4 text-sm leading-6 text-gray-300">
            The repository also includes a longer tester guide with the same
            steps and security notes.
          </p>
          <a
            href="https://github.com/nissan/reddi-agent-protocol/blob/main/docs/TESTER-SPECIALIST-ONBOARDING-DEVNET.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-300 hover:text-indigo-200"
          >
            Open full devnet tester guide on GitHub →
          </a>
        </section>
      </main>
    </div>
  );
}
