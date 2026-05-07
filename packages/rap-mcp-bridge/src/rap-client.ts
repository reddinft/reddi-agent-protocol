import type { BridgeConfig } from "./config.js";

export type DiscoverArgs = {
  task: string;
  taskTypeHint?: string;
  maxPerCallUsd?: number;
  requireAttestation?: boolean;
  limit?: number;
};

export class RapClient {
  constructor(private readonly config: BridgeConfig) {}

  async discoverSpecialists(args: DiscoverArgs): Promise<unknown> {
    try {
      const response = await fetch(`${this.config.rapBaseUrl}/api/planner/tools/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: args.task,
          taskTypeHint: args.taskTypeHint,
          policy: {
            maxPerCallUsd: args.maxPerCallUsd,
            requireAttestation: args.requireAttestation,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });
      const body = await response.text();
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
      if (!response.ok) {
        return { ok: false, backendReachable: true, boundary: "dry_run", status: response.status, error: parsed };
      }
      return { ok: true, backendReachable: true, boundary: "dry_run", backendUrl: this.config.rapBaseUrl, result: parsed };
    } catch (error) {
      return {
        ok: false,
        backendReachable: false,
        boundary: "dry_run",
        error: "backend_unreachable",
        detail: error instanceof Error ? error.message : "unknown_fetch_error",
      };
    }
  }
}
