import "server-only";

import { Keypair } from "@solana/web3.js";

export interface OperatorKeyStatus {
  present: boolean;
  valid: boolean;
  publicKey_suffix?: string;
  error?: string;
}

export function checkOperatorKeyStatus(): OperatorKeyStatus {
  const raw = process.env.ONBOARDING_ATTEST_OPERATOR_SECRET_KEY;
  if (!raw) {
    return {
      present: false,
      valid: false,
      error: "ONBOARDING_ATTEST_OPERATOR_SECRET_KEY not set",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      return {
        present: true,
        valid: false,
        error: `Expected 64-byte array, got ${Array.isArray(parsed) ? parsed.length : "non-array"}`,
      };
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed.map((n) => Number(n))));
    const publicKey = keypair.publicKey.toBase58();

    return {
      present: true,
      valid: true,
      publicKey_suffix: publicKey.slice(-8),
    };
  } catch (error) {
    return {
      present: true,
      valid: false,
      error: error instanceof Error ? error.message : "Parse error",
    };
  }
}
