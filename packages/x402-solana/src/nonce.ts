import type { NonceReplayStore } from './types';

/**
 * In-memory nonce store for replay protection.
 * In production, callers should provide a persistent store (Redis/DB) with TTL.
 */
const seenNonces = new Set<string>();

export class MemoryNonceReplayStore implements NonceReplayStore {
  private readonly seen = new Set<string>();

  checkAndStore(nonce: string): boolean {
    if (this.seen.has(nonce)) return false;
    this.seen.add(nonce);
    return true;
  }

  clear(): void {
    this.seen.clear();
  }

  get size(): number {
    return this.seen.size;
  }
}

/**
 * Check if nonce has been seen before, and store it if new.
 * @returns true if nonce is new, false if duplicate.
 */
export function checkAndStoreNonce(nonce: string): boolean {
  if (seenNonces.has(nonce)) return false;
  seenNonces.add(nonce);
  return true;
}

export const defaultNonceReplayStore: NonceReplayStore = {
  checkAndStore: checkAndStoreNonce,
};

/** Clear all stored nonces (for testing). */
export function clearNonces(): void {
  seenNonces.clear();
}

/** Get count of stored nonces (for debugging). */
export function getNonceCount(): number {
  return seenNonces.size;
}
