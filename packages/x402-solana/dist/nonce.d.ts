import type { NonceReplayStore } from './types';
export declare class MemoryNonceReplayStore implements NonceReplayStore {
    private readonly seen;
    checkAndStore(nonce: string): boolean;
    clear(): void;
    get size(): number;
}
/**
 * Check if nonce has been seen before, and store it if new.
 * @returns true if nonce is new, false if duplicate.
 */
export declare function checkAndStoreNonce(nonce: string): boolean;
export declare const defaultNonceReplayStore: NonceReplayStore;
/** Clear all stored nonces (for testing). */
export declare function clearNonces(): void;
/** Get count of stored nonces (for debugging). */
export declare function getNonceCount(): number;
