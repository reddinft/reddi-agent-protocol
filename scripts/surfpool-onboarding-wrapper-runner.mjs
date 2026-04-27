import fs from "fs";

const appBase = process.env.APP_BASE;
const endpointUrl = process.env.ENDPOINT_URL;
const consumerPubkey = process.env.CONSUMER_PUBKEY;
const outputPath = process.env.WRAPPER_FLOW_RESULT_PATH;

if (!appBase || !endpointUrl || !consumerPubkey || !outputPath) {
  throw new Error("Missing required env: APP_BASE, ENDPOINT_URL, CONSUMER_PUBKEY, WRAPPER_FLOW_RESULT_PATH");
}

async function post(path, body) {
  const res = await fetch(`${appBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: "invalid_json_response" };
  }
  if (!res.ok || !json.ok) {
    throw new Error(`${path} failed: status=${res.status} body=${JSON.stringify(json)}`);
  }
  return json;
}

async function get(path) {
  const res = await fetch(`${appBase}${path}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`${path} failed: status=${res.status} body=${JSON.stringify(json)}`);
  }
  return json;
}

const operatorStatus = await get("/api/onboarding/operator-key");
const attestorStatus = await get("/api/onboarding/attestation-operator");

const runtime = await post("/api/onboarding/runtime", {
  platform: "macos",
  port: 11434,
  consentExposeEndpoint: true,
  consentProtocolOps: true,
  protocolDomain: "https://reddi.tech",
});

const endpoint = await post("/api/onboarding/endpoint", {
  action: "create",
  consentExposeEndpoint: true,
  port: 11434,
  endpointUrl,
});

const wallet = await post("/api/onboarding/wallet", {
  action: "create",
  backupConfirmed: true,
  passphrase: "surfpool-wrapper-passphrase-123",
});

const walletAddress = wallet.result.walletAddress;

const healthcheck = await post("/api/onboarding/healthcheck", {
  walletAddress,
  endpointUrl,
});

if (healthcheck.result.status !== "pass") {
  throw new Error(`Expected healthcheck pass, got: ${JSON.stringify(healthcheck.result)}`);
}

const attestation = await post("/api/onboarding/attestation", {
  walletAddress,
  consumerWalletAddress: consumerPubkey,
  endpointUrl,
  healthcheckStatus: "pass",
  operator: "surfpool-wrapper-lane",
  scores: [8, 8, 8, 8, 8],
});

const out = {
  ok: true,
  operatorStatus,
  attestorStatus,
  runtimeReady: runtime.result.ready,
  endpoint: endpoint.result.endpointUrl,
  walletAddress,
  healthcheck: healthcheck.result,
  attestation: {
    signature: attestation.result.onchain.signature,
    attestationPda: attestation.result.onchain.attestationPda,
    operator: attestation.result.onchain.operator,
    consumer: attestation.result.onchain.consumer,
  },
};

fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
