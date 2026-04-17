import "server-only";

import { randomBytes, scryptSync, createCipheriv } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Keypair } from "@solana/web3.js";

export const SPONSORSHIP_LIMITS = {
  rentLamports: 1_500_000,
  registrationFeeLamports: 500_000,
};

export type CreateLocalWalletInput = {
  backupConfirmed: boolean;
  passphrase: string;
};

export type WalletCreateResult = {
  walletAddress: string;
  encryptedKeyPath: string;
  backupRequired: true;
  note: string;
};

export type SponsorshipResult = {
  lamportsApproved: number;
  lamportsCap: number;
  capEnforced: boolean;
  sponsorshipId: string;
  note: string;
};

const WALLET_PATH = join(process.cwd(), "data", "onboarding", "local-wallet.json");

function encryptSecretKey(secretKey: Uint8Array, passphrase: string) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(secretKey)), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    authTag: tag.toString("base64"),
  };
}

export function createLocalWallet(input: CreateLocalWalletInput): WalletCreateResult {
  if (!input.backupConfirmed) {
    throw new Error("Backup confirmation is required before creating a local onboarding wallet.");
  }

  if (!input.passphrase || input.passphrase.length < 12) {
    throw new Error("Passphrase must be at least 12 characters.");
  }

  const wallet = Keypair.generate();
  const encrypted = encryptSecretKey(wallet.secretKey, input.passphrase);

  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(
    WALLET_PATH,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        walletAddress: wallet.publicKey.toBase58(),
        encrypted,
      },
      null,
      2
    )
  );

  return {
    walletAddress: wallet.publicKey.toBase58(),
    encryptedKeyPath: WALLET_PATH,
    backupRequired: true,
    note: "Local non-custodial wallet created and encrypted at rest.",
  };
}

export function prepareSponsorship(walletAddress: string): SponsorshipResult {
  if (!walletAddress || walletAddress.length < 32) {
    throw new Error("Valid wallet address is required for sponsorship preparation.");
  }

  const lamportsCap = SPONSORSHIP_LIMITS.rentLamports + SPONSORSHIP_LIMITS.registrationFeeLamports;
  const requestedLamports = lamportsCap;

  return {
    lamportsApproved: Math.min(requestedLamports, lamportsCap),
    lamportsCap,
    capEnforced: requestedLamports <= lamportsCap,
    sponsorshipId: `sponsor_${Date.now().toString(36)}`,
    note: "Sponsorship scoped to onboarding-only costs (rent + registration fee).",
  };
}
