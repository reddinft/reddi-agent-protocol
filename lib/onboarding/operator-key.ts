import "server-only";

import { Keypair } from "@solana/web3.js";

export type OperatorKeyState = "missing" | "invalid" | "ready";

export interface OperatorKeyStatus {
  present: boolean;
  valid: boolean;
  state: OperatorKeyState;
  publicKey_suffix?: string;
  error?: string;
  checkedAt: string;
}

export function checkOperatorKeyStatus(): OperatorKeyStatus {
  const raw = process.env.ONBOARDING_ATTEST_OPERATOR_SECRET_KEY;
  if (!raw) {
    return {
      present: false,
      valid: false,
      state: "missing",
      error: "ONBOARDING_ATTEST_OPERATOR_SECRET_KEY not set",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      return {
        present: true,
        valid: false,
        state: "invalid",
        error: `Expected 64-byte array, got ${Array.isArray(parsed) ? parsed.length : "non-array"}`,
        checkedAt: new Date().toISOString(),
      };
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed.map((n) => Number(n))));
    const publicKey = keypair.publicKey.toBase58();

    return {
      present: true,
      valid: true,
      state: "ready",
      publicKey_suffix: publicKey.slice(-8),
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      present: true,
      valid: false,
      state: "invalid",
      error: error instanceof Error ? error.message : "Parse error",
      checkedAt: new Date().toISOString(),
    };
  }
}
