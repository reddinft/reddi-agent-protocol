/**
 * GET /api/planner/tools
 *
 * Returns the full MCP tool manifest — OpenAI function-call schemas +
 * ElizaOS action manifest. Frameworks can fetch this once and register
 * all three tools automatically.
 */
import { MCP_TOOL_SCHEMAS, ELIZA_ACTION_MANIFEST } from "@/lib/mcp/tools";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { origin } = new URL(req.url);

  return Response.json({
    ok: true,
    protocol: "reddi-agent-protocol",
    version: "1.0.0",
    baseUrl: origin,
    tools: {
      openai_function_calls: MCP_TOOL_SCHEMAS,
      eliza_actions: ELIZA_ACTION_MANIFEST,
      endpoints: {
        resolve:  `${origin}/api/planner/tools/resolve`,
        invoke:   `${origin}/api/planner/tools/invoke`,
        signal:   `${origin}/api/planner/tools/signal`,
      },
    },
    usage: {
      resolve:  "POST { task, taskTypeHint?, policy? }",
      invoke:   "POST { prompt, targetWallet?, policy? }",
      signal:   "POST { runId, score, notes?, agreesWithAttestation? }",
    },
    docs: "https://github.com/nissan/reddi-agent-protocol",
  });
}
