"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PlaywrightWalletAdapter } from "@/lib/wallet/playwright-wallet-adapter";
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
  const enablePlaywrightWallet = process.env.NEXT_PUBLIC_ENABLE_PLAYWRIGHT_WALLET === "true";

  const wallets = useMemo(() => {
    const adapters = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
    if (enablePlaywrightWallet) {
      adapters.unshift(new PlaywrightWalletAdapter());
    }
    return adapters;
  }, [enablePlaywrightWallet]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={enablePlaywrightWallet}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
