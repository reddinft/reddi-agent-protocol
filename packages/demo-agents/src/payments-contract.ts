const MAX_PRIVATE_DELAY_MS = BigInt(30 * 60 * 1000);

export type TransferVisibility = "public" | "private";

export interface TransferContract {
  visibility: TransferVisibility;
  minDelayMs?: string;
  maxDelayMs?: string;
  split?: number;
}

type SettlementModeLike = "auto" | "magicblock_per" | "vanish_core" | "public";

function parseOptionalPositiveIntegerString(value: string | undefined, field: string): string | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${field} must be a positive integer string`);
  }
  return value;
}

function parseOptionalSplit(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error("DEMO_PRIVATE_SPLIT must be an integer between 1 and 10");
  }
  const split = Number(value);
  if (!Number.isInteger(split) || split < 1 || split > 10) {
    throw new Error("DEMO_PRIVATE_SPLIT must be an integer between 1 and 10");
  }
  return split;
}

export function resolveTransferContractForDemo(
  requestedSettlementMode: SettlementModeLike
): TransferContract {
  const visibility: TransferVisibility =
    requestedSettlementMode === "public" ? "public" : "private";

  if (visibility === "public") {
    return { visibility: "public" };
  }

  const minDelayMs = parseOptionalPositiveIntegerString(
    process.env.DEMO_PRIVATE_MIN_DELAY_MS?.trim(),
    "DEMO_PRIVATE_MIN_DELAY_MS"
  );
  const maxDelayMs = parseOptionalPositiveIntegerString(
    process.env.DEMO_PRIVATE_MAX_DELAY_MS?.trim(),
    "DEMO_PRIVATE_MAX_DELAY_MS"
  );
  const split = parseOptionalSplit(process.env.DEMO_PRIVATE_SPLIT?.trim());

  if (
    minDelayMs !== undefined &&
    maxDelayMs !== undefined &&
    BigInt(maxDelayMs) < BigInt(minDelayMs)
  ) {
    throw new Error("DEMO_PRIVATE_MAX_DELAY_MS must be >= DEMO_PRIVATE_MIN_DELAY_MS");
  }

  if (
    (minDelayMs !== undefined && BigInt(minDelayMs) > MAX_PRIVATE_DELAY_MS) ||
    (maxDelayMs !== undefined && BigInt(maxDelayMs) > MAX_PRIVATE_DELAY_MS)
  ) {
    throw new Error("Private delay bounds must be <= 1800000ms (30 minutes)");
  }

  return {
    visibility,
    ...(minDelayMs !== undefined ? { minDelayMs } : {}),
    ...(maxDelayMs !== undefined ? { maxDelayMs } : {}),
    ...(split !== undefined ? { split } : {}),
  };
}

export function formatTransferContract(contract: TransferContract): string {
  if (contract.visibility === "public") {
    return "visibility=public";
  }

  const details = ["visibility=private"];
  if (contract.minDelayMs !== undefined) details.push(`minDelayMs=${contract.minDelayMs}`);
  if (contract.maxDelayMs !== undefined) details.push(`maxDelayMs=${contract.maxDelayMs}`);
  if (contract.split !== undefined) details.push(`split=${contract.split}`);
  return details.join(", ");
}
