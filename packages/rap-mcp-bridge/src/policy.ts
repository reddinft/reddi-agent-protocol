export type BridgePolicyState = {
  mode: "dry_run";
  allowPayment: false;
  allowInvoke: false;
  allowPrivatePayloads: false;
  allowMainnet: false;
  toolNames: readonly [
    "reddi.discover_specialists",
    "reddi.request_quote",
    "reddi.verify_receipt",
    "reddi.export_disclosure_ledger",
  ];
};

export function currentPolicy(): BridgePolicyState {
  return {
    mode: "dry_run",
    allowPayment: false,
    allowInvoke: false,
    allowPrivatePayloads: false,
    allowMainnet: false,
    toolNames: [
      "reddi.discover_specialists",
      "reddi.request_quote",
      "reddi.verify_receipt",
      "reddi.export_disclosure_ledger",
    ],
  };
}
