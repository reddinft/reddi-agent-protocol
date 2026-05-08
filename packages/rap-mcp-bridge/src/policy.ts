export type BridgePolicyState = {
  mode: "dry_run" | "devnet";
  allowPayment: boolean;
  allowInvoke: boolean;
  allowPrivatePayloads: false;
  allowMainnet: false;
  toolNames: readonly string[];
};

export function currentPolicy(mode: "dry_run" | "devnet" = "dry_run", gatesReady = mode === "dry_run", invokeReady = false): BridgePolicyState {
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
    allowInvoke: effectiveMode === "devnet" && invokeReady,
    allowPrivatePayloads: false,
    allowMainnet: false,
    toolNames: effectiveMode === "devnet" ? [
      ...dryRunTools,
      "reddi.prepare_devnet_payment",
      "reddi.execute_devnet_payment",
      "reddi.verify_devnet_receipt",
      ...(invokeReady ? ["reddi.prepare_x402_specialist_call", "reddi.execute_x402_specialist_call", "reddi.verify_x402_specialist_receipt"] : []),
    ] : dryRunTools,
  };
}
