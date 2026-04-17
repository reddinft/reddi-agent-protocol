import "server-only";

import { randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

type Platform = "macos" | "ubuntu" | "windows";

export type RuntimeBootstrapInput = {
  platform: Platform;
  port: number;
  consentExposeEndpoint: boolean;
  consentProtocolOps: boolean;
  protocolDomain?: string;
};

export type RuntimeBootstrapResult = {
  ready: boolean;
  ollama: {
    installed: boolean;
    running: boolean;
    version?: string;
    startAttempted: boolean;
  };
  token: {
    generated: boolean;
    storedInKeychain: boolean;
    service: string;
    preview?: string;
    note?: string;
  };
  cors: {
    configured: boolean;
    allowlist: string[];
    configPath: string;
  };
  installHint?: string;
};

const TOKEN_SERVICE = "reddi-specialist-api-token";

async function runCommand(command: string, args: string[] = []) {
  return new Promise<{ ok: boolean; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", () => resolve({ ok: false, stdout, stderr }));
    child.on("close", (code) => {
      resolve({ ok: code === 0, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function isOllamaRunning(port: number) {
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

function installHintFor(platform: Platform) {
  if (platform === "macos") return "brew install ollama && brew services start ollama";
  if (platform === "ubuntu") return "curl -fsSL https://ollama.com/install.sh | sh";
  return "Install Ollama from https://ollama.com/download/windows";
}

async function tryStartOllama(platform: Platform) {
  if (platform === "windows") return false;
  try {
    const child = spawn("ollama", ["serve"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

async function storeTokenInKeychain(token: string, platform: Platform) {
  if (platform !== "macos") {
    return { stored: false, note: "OS keychain storage currently implemented for macOS only." };
  }

  const user = process.env.USER || "loki";
  const cmd = await runCommand("security", [
    "add-generic-password",
    "-a",
    user,
    "-s",
    TOKEN_SERVICE,
    "-w",
    token,
    "-U",
  ]);

  if (!cmd.ok) {
    return { stored: false, note: cmd.stderr || "Failed to write token into macOS keychain." };
  }

  return { stored: true };
}

function writeCorsConfig(allowlist: string[]) {
  const configPath = join(process.cwd(), "data", "onboarding", "runtime-config.json");
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    cors: {
      allowOrigins: allowlist,
    },
  };
  writeFileSync(configPath, JSON.stringify(payload, null, 2));
  return configPath;
}

export async function runRuntimeBootstrap(input: RuntimeBootstrapInput): Promise<RuntimeBootstrapResult> {
  if (!input.consentExposeEndpoint || !input.consentProtocolOps) {
    throw new Error("Explicit consent is required before runtime bootstrap.");
  }

  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    throw new Error("Invalid Ollama port.");
  }

  const versionCheck = await runCommand("ollama", ["--version"]);
  const installed = versionCheck.ok;
  const startAttempted = installed;

  if (!installed) {
    const allowlist = [input.protocolDomain || "https://reddi.tech"];
    const configPath = writeCorsConfig(allowlist);
    return {
      ready: false,
      ollama: {
        installed: false,
        running: false,
        startAttempted: false,
      },
      token: {
        generated: false,
        storedInKeychain: false,
        service: TOKEN_SERVICE,
        note: "Token generation deferred until Ollama is installed.",
      },
      cors: {
        configured: true,
        allowlist,
        configPath,
      },
      installHint: installHintFor(input.platform),
    };
  }

  let running = await isOllamaRunning(input.port);
  if (!running) {
    await tryStartOllama(input.platform);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    running = await isOllamaRunning(input.port);
  }

  const tokenRaw = randomBytes(24).toString("base64url");
  const tokenResult = await storeTokenInKeychain(tokenRaw, input.platform);
  const allowlist = [input.protocolDomain || "https://reddi.tech"];
  const configPath = writeCorsConfig(allowlist);

  return {
    ready: running,
    ollama: {
      installed: true,
      running,
      version: versionCheck.stdout || undefined,
      startAttempted,
    },
    token: {
      generated: true,
      storedInKeychain: tokenResult.stored,
      service: TOKEN_SERVICE,
      preview: `${tokenRaw.slice(0, 4)}...${tokenRaw.slice(-4)}`,
      note: tokenResult.note,
    },
    cors: {
      configured: true,
      allowlist,
      configPath,
    },
    installHint: running ? undefined : installHintFor(input.platform),
  };
}

