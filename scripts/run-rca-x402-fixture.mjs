#!/usr/bin/env node

import http from "node:http";

const port = Number(process.env.RCA_FIXTURE_PORT || 19090);

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    "content-type": "application/json",
    ...headers,
  });
  res.end(JSON.stringify(body));
};

const x402Header = JSON.stringify({
  version: 1,
  network: "solana",
  amount: "1000",
  paymentAddress: "11111111111111111111111111111111",
  nonce: "rca-fixture",
  resource: "/v1/chat/completions",
});

const server = http.createServer((req, res) => {
  if (!req.url) {
    return json(res, 400, { error: "missing_url" });
  }

  if (req.method === "HEAD" && req.url === "/") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    return json(res, 200, { ok: true, fixture: "rca-x402" });
  }

  if (req.method === "GET" && req.url === "/healthz") {
    return json(res, 200, { status: "ok", fixture: "rca-x402" });
  }

  if (req.method === "GET" && req.url === "/x402/health") {
    return json(
      res,
      402,
      { error: "payment_required", reason: "x402_fixture_probe" },
      { "x402-request": x402Header }
    );
  }

  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    return json(
      res,
      402,
      { error: "payment_required", reason: "x402_fixture_chat" },
      { "x402-request": x402Header }
    );
  }

  return json(res, 404, { error: "not_found", path: req.url, method: req.method });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[rca-x402-fixture] listening on http://127.0.0.1:${port}`);
  console.log("[rca-x402-fixture] routes: HEAD /, GET /healthz, POST /v1/chat/completions (402), GET /x402/health (402)");
});
