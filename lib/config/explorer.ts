import { getNetworkProfile } from "@/lib/config/network";

export function explorerClusterSuffix(): string {
  const profile = getNetworkProfile();

  if (profile.solana.explorerClusterParam === "mainnet") {
    return "";
  }

  if (profile.solana.explorerClusterParam === "devnet") {
    return "?cluster=devnet";
  }

  const customUrl = encodeURIComponent(profile.solana.rpcHttp);
  return `?cluster=custom&customUrl=${customUrl}`;
}

export function toExplorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}${explorerClusterSuffix()}`;
}

export function toExplorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}${explorerClusterSuffix()}`;
}
