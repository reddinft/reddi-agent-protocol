export type BridgePolicyState = {
  mode: "dry_run" | "devnet";
  allowPayment: boolean;
  allowInvoke: false;
  allowPrivatePayloads: false;
  allowMainnet: false;
  toolNames: readonly string[];
};

export function currentPolicy(mode: "dry_run" | "devnet" = "dry_run", gatesReady = mode === "dry_run"): BridgePolicyState {
  const effectiveMode = mode === "devnet" && gatesReady ? "devnet" : "dry_run";
  const dryRunTools = [
    "reddi.discover_specialists",
    "reddi.request_quote",
    "reddi.verify_receipt",
    "reddi.export_disclosure_ledger",
  ] as const;
  return {
    mode: effectiveMode,
    allowPayment: effectiveMode === "devnet",
    allowInvoke: false,
    allowPrivatePayloads: false,
    allowMainnet: false,
    toolNames: effectiveMode === "devnet" ? [
      ...dryRunTools,
      "reddi.prepare_devnet_payment",
      "reddi.execute_devnet_payment",
      "reddi.verify_devnet_receipt",
    ] : dryRunTools,
  };
}
