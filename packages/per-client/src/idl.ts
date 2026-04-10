/**
 * IDL-derived Anchor instruction discriminators.
 *
 * Anchor computes discriminators as the first 8 bytes of SHA256("global:<ix_name>").
 * These are derived programmatically from `target/idl/escrow.json` — do not hardcode.
 *
 * To regenerate:
 *   import crypto from "crypto";
 *   const disc = (name: string) =>
 *     crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
 */
import crypto from "crypto";

function disc(ixName: string): Buffer {
  return crypto.createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

export const DISCRIMINATORS = {
  lock_escrow: disc("lock_escrow"),
  release_escrow: disc("release_escrow"),
  release_escrow_per: disc("release_escrow_per"),
  delegate_escrow: disc("delegate_escrow"),
  cancel_escrow: disc("cancel_escrow"),
  register_agent: disc("register_agent"),
  update_agent: disc("update_agent"),
  deregister_agent: disc("deregister_agent"),
  commit_rating: disc("commit_rating"),
  reveal_rating: disc("reveal_rating"),
  expire_rating: disc("expire_rating"),
  attest_quality: disc("attest_quality"),
  confirm_attestation: disc("confirm_attestation"),
  dispute_attestation: disc("dispute_attestation"),
} as const;
