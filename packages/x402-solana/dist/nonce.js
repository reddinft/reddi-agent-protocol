"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultNonceReplayStore = exports.MemoryNonceReplayStore = void 0;
exports.checkAndStoreNonce = checkAndStoreNonce;
exports.clearNonces = clearNonces;
exports.getNonceCount = getNonceCount;
/**
 * In-memory nonce store for replay protection.
 * In production, callers should provide a persistent store (Redis/DB) with TTL.
 */
const seenNonces = new Set();
class MemoryNonceReplayStore {
    constructor() {
        this.seen = new Set();
    }
    checkAndStore(nonce) {
        if (this.seen.has(nonce))
            return false;
        this.seen.add(nonce);
        return true;
    }
    clear() {
        this.seen.clear();
    }
    get size() {
        return this.seen.size;
    }
}
exports.MemoryNonceReplayStore = MemoryNonceReplayStore;
/**
 * Check if nonce has been seen before, and store it if new.
 * @returns true if nonce is new, false if duplicate.
 */
function checkAndStoreNonce(nonce) {
    if (seenNonces.has(nonce))
        return false;
    seenNonces.add(nonce);
    return true;
}
exports.defaultNonceReplayStore = {
    checkAndStore: checkAndStoreNonce,
};
/** Clear all stored nonces (for testing). */
function clearNonces() {
    seenNonces.clear();
}
/** Get count of stored nonces (for debugging). */
function getNonceCount() {
    return seenNonces.size;
}
