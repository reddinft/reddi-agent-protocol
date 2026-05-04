import { buildEconomicDemoLedgerReconciliation } from "@/lib/economic-demo/ledger-reconciliation";

export async function GET() {
  return Response.json({ ok: true, reconciliation: buildEconomicDemoLedgerReconciliation() });
}
