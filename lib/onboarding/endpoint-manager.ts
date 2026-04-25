import "server-only";

import { randomBytes } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type EndpointActionInput = {
  consentExposeEndpoint: boolean;
  port: number;
  endpointUrl?: string;
};

export type EndpointActionResult = {
  endpointUrl: string;
  status: "online" | "offline";
  heartbeatOk: boolean;
  heartbeatCheckedAt: string;
  provider: "ngrok" | "cloudflare-tunnel" | "localtunnel-compatible";
  tunnelCommand: string;
  proxyCommand: string;
  proxyPort: number;
  authHeaderName: string;
  authTokenPreview: string;
  authToken?: string;
  x402PublicPrefixes: string[];
  profilePath: string;
  note?: string;
};

type SpecialistProfile = {
  updatedAt: string;
  endpoint: {
    url: string;
    status: "online" | "offline";
    provider: "ngrok" | "cloudflare-tunnel" | "localtunnel-compatible";
    localPort: number;
    proxyPort: number;
    heartbeatOk: boolean;
    heartbeatCheckedAt: string;
    tunnelCommand: string;
    proxyCommand: string;
    note?: string;
    auth: {
      mode: "header_token";
      headerName: string;
      token: string;
      tokenPreview: string;
    };
  };
};

const PROFILE_PATH = join(process.cwd(), "data", "onboarding", "specialist-profile.json");
const PROXY_SCRIPT_PATH = join(process.cwd(), "data", "onboarding", "token-gated-proxy.mjs");
const AUTH_HEADER_NAME = "x-reddi-agent-token";
const X402_PUBLIC_PREFIXES = ["/v1", "/x402", "/healthz"] as const;

function normalizeEndpointUrl(url?: string) {
  if (!url?.trim()) return "";
  const raw = url.trim();
  if (raw.startsWith("https://")) return raw;
  if (raw.startsWith("http://")) return `https://${raw.slice("http://".length)}`;
  return `https://${raw}`;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function issueEndpointToken() {
  return randomBytes(24).toString("base64url");
}

function tokenPreview(token: string) {
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function inferSubdomain(endpointUrl: string) {
  try {
    const host = new URL(endpointUrl).hostname;
    return host.split(".")[0] || `reddi-${randomSuffix()}`;
  } catch {
    return `reddi-${randomSuffix()}`;
  }
}

function isCloudflareTunnelHost(endpointUrl: string) {
  try {
    const host = new URL(endpointUrl).hostname.toLowerCase();
    return host.includes("trycloudflare.com") || host.includes("cfargotunnel.com");
  } catch {
    return false;
  }
}

function inferTunnelProvider(endpointUrl: string): "ngrok" | "cloudflare-tunnel" | "localtunnel-compatible" {
  try {
    const host = new URL(endpointUrl).hostname.toLowerCase();
    if (isCloudflareTunnelHost(endpointUrl)) return "cloudflare-tunnel";
    if (host.includes("localtunnel.me")) return "localtunnel-compatible";
  } catch {
    // default below
  }
  return "ngrok";
}

function resolveProxyPort(localPort: number) {
  const candidate = localPort + 1000;
  return candidate <= 65535 ? candidate : Math.max(1, localPort - 1);
}

function ensureTokenProxyScript() {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });

  const script = `#!/usr/bin/env node
import http from "http";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
};

const targetPort = Number(getArg("--target-port", "11434"));
const listenPort = Number(getArg("--listen-port", "12434"));
const token = String(getArg("--token", "")).trim();
const headerName = String(getArg("--header", "x-reddi-agent-token")).toLowerCase();
const publicPrefixes = ${JSON.stringify(X402_PUBLIC_PREFIXES)};

if (!token) {
  console.error("Missing --token");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const path = String(req.url || "/");
  const isPublicPath = publicPrefixes.some((prefix) => path.startsWith(prefix));
  const provided = String(req.headers[headerName] || "").trim();
  if (!isPublicPath && provided !== token) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url || "/",
      method: req.method,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on("error", () => {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "upstream_unreachable" }));
  });

  req.pipe(upstream);
});

server.listen(listenPort, "127.0.0.1", () => {
  console.log(
    JSON.stringify({
      ok: true,
      mode: "header_token",
      listenPort,
      targetPort,
      headerName,
      publicPrefixes,
    })
  );
});
`;

  writeFileSync(PROXY_SCRIPT_PATH, script, "utf8");
}

async function checkLocalRuntime(port: number) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkLocalTokenProxy(port: number, token: string) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tags`, {
      method: "GET",
      headers: {
        [AUTH_HEADER_NAME]: token,
      },
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkRemoteEndpoint(endpointUrl: string, token: string) {
  try {
    const res = await fetch(endpointUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        [AUTH_HEADER_NAME]: token,
      },
      signal: AbortSignal.timeout(2500),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

function writeProfile(profile: SpecialistProfile) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

function readProfile(): SpecialistProfile | null {
  try {
    const raw = readFileSync(PROFILE_PATH, "utf8");
    return JSON.parse(raw) as SpecialistProfile;
  } catch {
    return null;
  }
}

function buildTunnelCommand(proxyPort: number, endpointUrl: string) {
  const provider = inferTunnelProvider(endpointUrl);
  if (provider === "cloudflare-tunnel") {
    return `cloudflared tunnel --url http://127.0.0.1:${proxyPort}`;
  }
  if (provider === "localtunnel-compatible") {
    const subdomain = inferSubdomain(endpointUrl);
    return `npx localtunnel --port ${proxyPort} --subdomain ${subdomain}`;
  }

  return `ngrok http ${proxyPort}`;
}

function buildTunnelRecoveryNote(
  provider: "ngrok" | "cloudflare-tunnel" | "localtunnel-compatible",
  tunnelCommand: string
) {
  if (provider === "cloudflare-tunnel") {
    return `Tunnel appears down. Restart cloudflared against IPv4 localhost: ${tunnelCommand}`;
  }
  if (provider === "ngrok") {
    return `Tunnel appears down. Restart ngrok: ${tunnelCommand}`;
  }
  return `Tunnel appears down. Re-open tunnel: ${tunnelCommand}`;
}

function buildHeartbeatRecoveryNote(
  provider: "ngrok" | "cloudflare-tunnel" | "localtunnel-compatible",
  tunnelCommand: string
) {
  if (provider === "cloudflare-tunnel") {
    return `Endpoint heartbeat failed. Restart cloudflared with IPv4 localhost origin: ${tunnelCommand}`;
  }
  if (provider === "ngrok") {
    return `Endpoint heartbeat failed. Restart ngrok with: ${tunnelCommand}`;
  }
  return `Endpoint heartbeat failed. Re-open tunnel with: ${tunnelCommand}`;
}

function buildProxyCommand(localPort: number, proxyPort: number, token: string) {
  return `node ${PROXY_SCRIPT_PATH} --target-port ${localPort} --listen-port ${proxyPort} --header ${AUTH_HEADER_NAME} --token ${token}`;
}

export async function createOrRotateEndpoint(input: EndpointActionInput): Promise<EndpointActionResult> {
  if (!input.consentExposeEndpoint) {
    throw new Error("Endpoint creation requires explicit endpoint exposure consent.");
  }

  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    throw new Error("Invalid local runtime port.");
  }

  ensureTokenProxyScript();

  const endpointUrl =
    normalizeEndpointUrl(input.endpointUrl) || `https://your-subdomain.ngrok-free.app`;
  const token = issueEndpointToken();
  const proxyPort = resolveProxyPort(input.port);
  const proxyCommand = buildProxyCommand(input.port, proxyPort, token);
  const tunnelCommand = buildTunnelCommand(proxyPort, endpointUrl);
  const provider = inferTunnelProvider(endpointUrl);

  const localOk = await checkLocalRuntime(input.port);
  const localProxyOk = await checkLocalTokenProxy(proxyPort, token);
  const remoteOk = await checkRemoteEndpoint(endpointUrl, token);
  const heartbeatOk = localOk && remoteOk;
  const heartbeatCheckedAt = new Date().toISOString();

  const note = heartbeatOk
    ? "Endpoint reachable through scoped token-gated proxy (x402 public paths bypass token)."
    : !localOk
    ? "Local Ollama runtime is unreachable on the selected port. Restart runtime and retry."
    : !localProxyOk && !remoteOk
    ? `Token-gated proxy is not running. Start it first: ${proxyCommand}`
    : !remoteOk
    ? buildTunnelRecoveryNote(provider, tunnelCommand)
    : `Endpoint check failed. Re-run endpoint onboarding.`;

  const profile: SpecialistProfile = {
    updatedAt: heartbeatCheckedAt,
    endpoint: {
      url: endpointUrl,
      status: heartbeatOk ? "online" : "offline",
      provider,
      localPort: input.port,
      proxyPort,
      heartbeatOk,
      heartbeatCheckedAt,
      tunnelCommand,
      proxyCommand,
      note,
      auth: {
        mode: "header_token",
        headerName: AUTH_HEADER_NAME,
        token,
        tokenPreview: tokenPreview(token),
      },
    },
  };

  writeProfile(profile);

  return {
    endpointUrl,
    status: profile.endpoint.status,
    heartbeatOk,
    heartbeatCheckedAt,
    provider,
    tunnelCommand,
    proxyCommand,
    proxyPort,
    authHeaderName: AUTH_HEADER_NAME,
    authTokenPreview: profile.endpoint.auth.tokenPreview,
    authToken: token,
    x402PublicPrefixes: [...X402_PUBLIC_PREFIXES],
    profilePath: PROFILE_PATH,
    note,
  };
}

export async function heartbeatEndpoint(input: {
  port?: number;
  endpointUrl?: string;
}): Promise<EndpointActionResult> {
  const existing = readProfile();
  if (!existing && (!input.port || !input.endpointUrl)) {
    throw new Error("No endpoint profile found. Create endpoint first.");
  }

  const port = input.port ?? existing?.endpoint.localPort;
  const endpointUrl = normalizeEndpointUrl(input.endpointUrl || existing?.endpoint.url);
  const token = existing?.endpoint.auth.token;
  const proxyPort = existing?.endpoint.proxyPort ?? (port ? resolveProxyPort(port) : undefined);

  if (!port || !endpointUrl || !token || !proxyPort) {
    throw new Error("Endpoint heartbeat requires endpoint URL, port, and token profile.");
  }

  const tunnelCommand = buildTunnelCommand(proxyPort, endpointUrl);
  const provider = inferTunnelProvider(endpointUrl);
  const proxyCommand = buildProxyCommand(port, proxyPort, token);

  const localOk = await checkLocalRuntime(port);
  const localProxyOk = await checkLocalTokenProxy(proxyPort, token);
  const remoteOk = await checkRemoteEndpoint(endpointUrl, token);

  const heartbeatOk = localOk && remoteOk;
  const heartbeatCheckedAt = new Date().toISOString();
  const note = heartbeatOk
    ? "Endpoint reachable through scoped token-gated proxy (x402 public paths bypass token)."
    : !localOk
    ? "Local runtime is offline. Re-run runtime bootstrap."
    : !localProxyOk && !remoteOk
    ? `Token-gated proxy is offline. Start it with: ${proxyCommand}`
    : !remoteOk
    ? buildHeartbeatRecoveryNote(provider, tunnelCommand)
    : "Endpoint heartbeat failed. Re-run endpoint onboarding.";

  const profile: SpecialistProfile = {
    updatedAt: heartbeatCheckedAt,
    endpoint: {
      url: endpointUrl,
      status: heartbeatOk ? "online" : "offline",
      provider,
      localPort: port,
      proxyPort,
      heartbeatOk,
      heartbeatCheckedAt,
      tunnelCommand,
      proxyCommand,
      note,
      auth: {
        mode: "header_token",
        headerName: AUTH_HEADER_NAME,
        token,
        tokenPreview: tokenPreview(token),
      },
    },
  };

  writeProfile(profile);

  return {
    endpointUrl,
    status: profile.endpoint.status,
    heartbeatOk,
    heartbeatCheckedAt,
    provider,
    tunnelCommand,
    proxyCommand,
    proxyPort,
    authHeaderName: AUTH_HEADER_NAME,
    authTokenPreview: profile.endpoint.auth.tokenPreview,
    x402PublicPrefixes: [...X402_PUBLIC_PREFIXES],
    profilePath: PROFILE_PATH,
    note,
  };
}
