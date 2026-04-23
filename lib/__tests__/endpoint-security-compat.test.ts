import { readFileSync } from "fs";
import { join } from "path";

import { createOrRotateEndpoint } from "@/lib/onboarding/endpoint-manager";

describe("endpoint security compatibility (Bucket D)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("rejects endpoint creation without explicit consent", async () => {
    await expect(
      createOrRotateEndpoint({
        consentExposeEndpoint: false,
        port: 11434,
      })
    ).rejects.toThrow("Endpoint creation requires explicit endpoint exposure consent.");
  });

  it("returns x402 public bypass prefixes in endpoint result", async () => {
    const result = await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://reddi-test.localtunnel.me",
    });

    expect(result.x402PublicPrefixes).toEqual(["/v1", "/x402", "/healthz"]);
  });

  it("generated token-gated proxy script bypasses public x402 paths and gates non-public paths", async () => {
    await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://reddi-test.localtunnel.me",
    });

    const scriptPath = join(process.cwd(), "data", "onboarding", "token-gated-proxy.mjs");
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain('const publicPrefixes = ["/v1","/x402","/healthz"]');
    expect(script).toContain("const isPublicPath = publicPrefixes.some((prefix) => path.startsWith(prefix));");
    expect(script).toContain("if (!isPublicPath && provided !== token)");
    expect(script).toContain('res.statusCode = 401');
  });
});
