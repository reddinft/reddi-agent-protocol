import { createHash } from "node:crypto";

export type JsonValue = null | boolean | string | number | JsonValue[] | { [key: string]: JsonValue | undefined };

export function canonicalize(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v as JsonValue)}`).join(",")}}`;
}

export function sha256Json(value: JsonValue): string {
  return `sha256:${createHash("sha256").update(canonicalize(value)).digest("hex")}`;
}
