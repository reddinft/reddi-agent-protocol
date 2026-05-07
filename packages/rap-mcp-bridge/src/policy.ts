export type BridgePolicyState = {
  mode: "dry_run" | "devnet";
  allowPayment: boolean;
  allowInvoke: false;
  allowPrivatePayloads: false;
  allowMainnet: false;
  toolNames: readonly string[];
};

export function currentPolicy(mode: "dry_run" | "devnet" = "dry_run"): BridgePolicyState {
  const dryRunTools = [
    "reddi.discover_specialists",
    "reddi.request_quote",
    "reddi.verify_receipt",
    "reddi.export_disclosure_ledger",
  ] as const;
  return {
    mode,
    allowPayment: mode === "devnet",
    allowInvoke: false,
    allowPrivatePayloads: false,
    allowMainnet: false,
    toolNames: mode === "devnet" ? [
      ...dryRunTools,
      "reddi.prepare_devnet_payment",
      "reddi.execute_devnet_payment",
      "reddi.verify_devnet_receipt",
    ] : dryRunTools,
  };
}
