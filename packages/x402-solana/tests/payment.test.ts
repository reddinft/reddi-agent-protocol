import {
  buildX402Challenge,
  DemoPaymentVerifier,
  parseX402Header,
  sendPayment,
  isValidPaymentAddress,
  isValidSolanaPublicKey,
} from '../src/payment';
import {
  checkAndStoreNonce,
  clearNonces,
  getNonceCount,
  MemoryNonceReplayStore,
} from '../src/nonce';
import { createX402Middleware, createX402Header } from '../src/middleware';

const validAddress = '3mL7kbtz3eK24vJ6wftjnLvhZrf93B71UEjB2DBDAddr';
const otherValidAddress = '6uiQbwMor4UrWYiDtAJcgHKYW4vUaM3BUVChPgzdALse';

describe('x402 Payment Module', () => {
  afterEach(() => {
    clearNonces();
  });

  describe('parseX402Header', () => {
    it('should parse valid x402-request header', () => {
      const header = JSON.stringify({ amount: 1000, currency: 'SOL', paymentAddress: validAddress, nonce: 'abc123' });
      const result = parseX402Header(header);
      expect(result.amount).toBe(1000);
      expect(result.currency).toBe('SOL');
      expect(result.paymentAddress).toBe(validAddress);
      expect(result.nonce).toBe('abc123');
    });

    it('should reject zero amount', () => {
      const header = JSON.stringify({ amount: 0, currency: 'SOL', paymentAddress: validAddress, nonce: 'abc123' });
      expect(() => parseX402Header(header)).toThrow('amount must be a positive number');
    });

    it('should reject negative amount', () => {
      const header = JSON.stringify({ amount: -100, currency: 'SOL', paymentAddress: validAddress, nonce: 'abc123' });
      expect(() => parseX402Header(header)).toThrow('amount must be a positive number');
    });

    it('should reject missing paymentAddress', () => {
      const header = JSON.stringify({ amount: 1000, currency: 'SOL', nonce: 'abc123' });
      expect(() => parseX402Header(header)).toThrow('paymentAddress is required');
    });

    it('should reject missing nonce', () => {
      const header = JSON.stringify({ amount: 1000, currency: 'SOL', paymentAddress: validAddress });
      expect(() => parseX402Header(header)).toThrow('nonce is required');
    });

    it('should reject invalid JSON', () => {
      expect(() => parseX402Header('{invalid json}')).toThrow('x402-request header is not valid JSON');
    });
  });

  describe('Nonce Store', () => {
    it('should accept first nonce', () => {
      expect(checkAndStoreNonce('nonce-1')).toBe(true);
    });

    it('should reject duplicate nonce', () => {
      checkAndStoreNonce('nonce-1');
      expect(checkAndStoreNonce('nonce-1')).toBe(false);
    });

    it('should accept different nonces', () => {
      checkAndStoreNonce('nonce-1');
      expect(checkAndStoreNonce('nonce-2')).toBe(true);
    });

    it('should allow re-acceptance after clearNonces', () => {
      checkAndStoreNonce('nonce-1');
      expect(getNonceCount()).toBe(1);
      clearNonces();
      expect(getNonceCount()).toBe(0);
      expect(checkAndStoreNonce('nonce-1')).toBe(true);
    });
  });

  describe('Payment Address Validation', () => {
    it('should validate correct Solana address', () => {
      expect(isValidPaymentAddress(validAddress)).toBe(true);
      expect(isValidSolanaPublicKey(validAddress)).toBe(true);
    });

    it('should reject address that is too short', () => {
      expect(isValidPaymentAddress('short')).toBe(false);
    });

    it('should reject address that is too long', () => {
      expect(isValidPaymentAddress('a'.repeat(50))).toBe(false);
    });

    it('should reject non-canonical 32-44 character strings', () => {
      expect(isValidPaymentAddress('a'.repeat(32))).toBe(false);
      expect(isValidPaymentAddress('O'.repeat(32))).toBe(false);
    });
  });

  describe('challenge builder and demo verifier', () => {
    const challenge = buildX402Challenge({
      network: 'solana-devnet',
      payTo: validAddress,
      amount: '0.03',
      currency: 'USDC',
      endpoint: 'https://planning.example.test/v1/chat/completions',
      nonce: 'nonce-123',
    });

    it('builds a strict Solana devnet challenge', () => {
      expect(challenge.version).toBe('1');
      expect(challenge.payTo).toBe(validAddress);
      expect(challenge.network).toBe('solana-devnet');
    });

    it('fails closed unless demo payments are explicitly enabled', async () => {
      const verifier = new DemoPaymentVerifier(false);
      const result = await verifier.verifyReceipt({ demo: true, token: `demo:${challenge.nonce}`, nonce: challenge.nonce }, challenge);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('demo_payment_disabled');
    });

    it('accepts explicit demo receipts and stores nonce once', async () => {
      const verifier = new DemoPaymentVerifier(true);
      const store = new MemoryNonceReplayStore();
      const receipt = { demo: true, token: `demo:${challenge.nonce}`, nonce: challenge.nonce };
      const first = await verifier.verifyReceipt(receipt, challenge, store);
      expect(first.ok).toBe(true);
      const second = await verifier.verifyReceipt(receipt, challenge, store);
      expect(second.ok).toBe(false);
      if (!second.ok) expect(second.reason).toBe('duplicate_nonce');
    });

    it('rejects caller-authored structured demo receipts', async () => {
      const verifier = new DemoPaymentVerifier(true);
      const structured = await verifier.verifyReceipt({ demo: true, ...challenge }, challenge);
      expect(structured.ok).toBe(false);
      if (!structured.ok) expect(structured.reason).toBe('invalid_receipt');
    });

    it('rejects non-demo structured receipts until real settlement verification exists', async () => {
      const verifier = new DemoPaymentVerifier(true);
      const unsigned = await verifier.verifyReceipt({ ...challenge, signature: 'caller-authored' }, challenge);
      expect(unsigned.ok).toBe(false);
      if (!unsigned.ok) expect(unsigned.reason).toBe('unsupported_receipt');
    });
  });

  describe('sendPayment', () => {
    it('should return receipt with matching amount and nonce', async () => {
      const request = { amount: 5000, currency: 'SOL', paymentAddress: validAddress, nonce: 'test-nonce-123' };
      const receipt = await sendPayment(request);
      expect(receipt.lamports).toBe(5000);
      expect(receipt.nonce).toBe('test-nonce-123');
      expect(receipt.txSignature).toBeDefined();
      expect(receipt.slot).toBeDefined();
    });
  });

  describe('Middleware Helper', () => {
    it('should create valid x402-request header', () => {
      const header = createX402Header(1000, validAddress, 'nonce-123');
      const parsed = parseX402Header(header);
      expect(parsed.amount).toBe(1000);
      expect(parsed.nonce).toBe('nonce-123');
    });
  });
});
