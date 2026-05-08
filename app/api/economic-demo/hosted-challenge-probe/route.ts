import { runEconomicDemoHostedChallengeProbe } from "@/lib/economic-demo/hosted-challenge-probe";

export const dynamic = "force-dynamic";

export async function POST() {
  const probe = await runEconomicDemoHostedChallengeProbe({ timeoutMs: 5_000 });
  const status = probe.summary.allChallengesObserved ? 200 : 502;
  return Response.json(
    { ok: probe.summary.allChallengesObserved, probe },
    { status },
  );
}
