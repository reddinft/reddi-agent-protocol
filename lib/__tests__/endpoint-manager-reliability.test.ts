import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { createOrRotateEndpoint, heartbeatEndpoint } from "@/lib/onboarding/endpoint-manager";

describe("endpoint manager reliability contracts (E1)", () => {
  const profilePath = join(process.cwd(), "data", "onboarding", "specialist-profile.json");

  beforeEach(() => {
    if (existsSync(profilePath)) unlinkSync(profilePath);
    (global.fetch as jest.Mock | undefined)?.mockReset?.();
  });

  it("returns offline with runtime remediation note when local runtime is unreachable", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://agent.example",
    });

    expect(result.status).toBe("offline");
    expect(result.heartbeatOk).toBe(false);
    expect(result.note).toMatch(/Local Ollama runtime is unreachable/i);
  });

  it("heartbeat can recover to online when remote endpoint responds", async () => {
    // Seed profile as online first.
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://agent.example",
    });

    // Transition case: local runtime up, local proxy down, remote endpoint up.
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 }) // local runtime
      .mockRejectedValueOnce(new Error("proxy offline")) // local proxy
      .mockResolvedValueOnce({ ok: false, status: 200 }); // remote HEAD success (<500)
    global.fetch = fetchMock as unknown as typeof fetch;

    const hb = await heartbeatEndpoint({});
    expect(hb.status).toBe("online");
    expect(hb.heartbeatOk).toBe(true);
    expect(hb.note).toMatch(/reachable through scoped token-gated proxy/i);
  });

  it("heartbeat reports tunnel remediation when runtime/proxy are up but remote is down", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://agent.example",
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 }) // local runtime
      .mockResolvedValueOnce({ ok: true, status: 200 }) // local proxy
      .mockRejectedValueOnce(new Error("remote offline")); // remote endpoint
    global.fetch = fetchMock as unknown as typeof fetch;

    const hb = await heartbeatEndpoint({});
    expect(hb.status).toBe("offline");
    expect(hb.heartbeatOk).toBe(false);
    expect(hb.note).toMatch(/Re-open tunnel/i);
  });

  it("heartbeat reports proxy remediation when runtime is up but proxy/remote are down", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as unknown as typeof fetch;
    await createOrRotateEndpoint({
      consentExposeEndpoint: true,
      port: 11434,
      endpointUrl: "https://agent.example",
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 }) // local runtime
      .mockRejectedValueOnce(new Error("proxy offline")) // local proxy
      .mockRejectedValueOnce(new Error("remote offline")); // remote endpoint
    global.fetch = fetchMock as unknown as typeof fetch;

    const hb = await heartbeatEndpoint({});
    expect(hb.status).toBe("offline");
    expect(hb.heartbeatOk).toBe(false);
    expect(hb.note).toMatch(/Token-gated proxy is offline/i);
  });
});
