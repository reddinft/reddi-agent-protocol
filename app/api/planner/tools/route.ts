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
        register_consumer: `${origin}/api/planner/tools/register-consumer`,
        resolve:  `${origin}/api/planner/tools/resolve`,
        resolve_attestor: `${origin}/api/planner/tools/resolve-attestor`,
        invoke:   `${origin}/api/planner/tools/invoke`,
        signal:   `${origin}/api/planner/tools/signal`,
        decide_settlement: `${origin}/api/planner/tools/release`,
      },
    },
    usage: {
      register_consumer: "POST { walletAddress, preferredIntegration?, metadata? }",
      resolve:  "POST { task, taskTypeHint?, policy? }",
      resolve_attestor: "POST { taskTypeHint?, minAttestationAccuracy?, maxPerCallUsd? }",
      invoke:   "POST { prompt, targetWallet?, policy? }",
      signal:   "POST { runId, score, notes?, agreesWithAttestation? }",
      decide_settlement: "POST { runId, decision, notes?, consumerWallet? }",
    },
    docs: "https://github.com/nissan/reddi-agent-protocol",
  });
}
