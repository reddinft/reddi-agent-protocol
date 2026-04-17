import { NextResponse } from "next/server";
import {
  checkWalletBackupExists,
  getWalletRecoveryOptions,
} from "@/lib/onboarding/wallet-recovery";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    backup_exists: checkWalletBackupExists(),
    recovery_options: getWalletRecoveryOptions(),
  });
}
