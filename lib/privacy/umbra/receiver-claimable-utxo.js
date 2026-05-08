export function selectReceiverClaimableUtxos(scanned, amountBaseUnits, recipientAddress) {
  const receiverUtxos = [
    ...(scanned.publicReceived ?? []).map((utxo) => ({ ...utxo, __bucket: "publicReceived" })),
    ...(scanned.received ?? []).map((utxo) => ({ ...utxo, __bucket: "received" })),
  ];

  const matching = receiverUtxos.filter((utxo) => {
    const amountMatches = utxo.amount === undefined || BigInt(utxo.amount.toString()) === amountBaseUnits;
    const destinationMatches = utxo.destinationAddress === undefined || String(utxo.destinationAddress) === recipientAddress;
    return amountMatches && destinationMatches;
  });

  return (matching.length > 0 ? matching : receiverUtxos)
    .sort((a, b) => receiverUtxoOrder(b) - receiverUtxoOrder(a))
    .slice(0, 1);
}

function receiverUtxoOrder(utxo) {
  return Number(utxo.insertionIndex ?? utxo.leafIndex ?? utxo.commitmentIndex ?? 0);
}
