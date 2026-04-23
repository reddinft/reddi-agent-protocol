const mockMkdirSync = jest.fn();
const mockWriteFileSync = jest.fn();

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
}));

describe("bake-trace route", () => {
  beforeEach(() => {
    jest.resetModules();
    mockMkdirSync.mockClear();
    mockWriteFileSync.mockClear();
  });

  it("persists trace payload to disk and returns ok", async () => {
    const { POST } = await import("@/app/api/bake-trace/route");
    const payload = { trace: [{ section: "Planning" }], output: "html" };

    const res = await POST(new Request("http://localhost/api/bake-trace", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining("data"), { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("baked-trace.json"),
      expect.stringContaining("Planning")
    );
  });

  it("handles arbitrary trace payloads without throwing", async () => {
    const { POST } = await import("@/app/api/bake-trace/route");
    const res = await POST(new Request("http://localhost/api/bake-trace", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trace: [], output: "", metadata: { model: "qwen3:8b" } }),
    }));

    expect(res.status).toBe(200);
  });
});
