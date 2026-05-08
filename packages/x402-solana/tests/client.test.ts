import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  assertDevnetRpcUrl,
  challengeFromX402RequestHeader,
  createSolanaDevnetUsdcPaymentClient,
  executeDevnetUsdcPayment,
  prepareDevnetUsdcPayment,
  usdcAmountToMicroUnits,
  validateDevnetUsdcChallenge,
  type DevnetUsdcPaymentClient,
} from '../src/client';
import { buildX402Challenge } from '../src/payment';

const payTo = '3mL7kbtz3eK24vJ6wftjnLvhZrf93B71UEjB2DBDAddr';
const usdcMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const endpoint = 'https://reddi-code-generation.preview.reddi.tech/v1/chat/completions';

function tempKeypairPath(): { path: string; keypair: Keypair } {
  const keypair = Keypair.generate();
  const dir = mkdtempSync(join(tmpdir(), 'reddi-x402-devnet-wallet-'));
  const path = join(dir, 'wallet.json');
  writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
  return { path, keypair };
}

function challenge(overrides: Partial<Parameters<typeof buildX402Challenge>[0]> = {}) {
  return buildX402Challenge({
    network: 'solana-devnet',
    payTo,
    amount: '0.05',
    currency: 'USDC',
    endpoint,
    nonce: 'nonce-123',
    ...overrides,
  });
}

function config(walletKeypairPath: string, overrides = {}) {
  return {
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint,
    walletKeypairPath,
    endpointAllowlist: [endpoint],
    maxUsdcMicroUnits: 150_000,
    ...overrides,
  };
}

function fakeClient(overrides: Partial<DevnetUsdcPaymentClient> = {}): DevnetUsdcPaymentClient {
  return {
    async getSolBalanceLamports() { return LAMPORTS_PER_SOL; },
    async getUsdcBalanceMicroUnits() { return 100_000n; },
    async getOrCreateDestinationTokenAccount() { return 'dest-token-account'; },
    async submitUsdcTransfer() { return { signature: 'devnet-usdc-signature', destinationTokenAccount: 'dest-token-account' }; },
    ...overrides,
  };
}

describe('devnet USDC x402 payer client', () => {
  it('converts decimal USDC amounts to micro-units exactly', () => {
    expect(usdcAmountToMicroUnits('0.05')).toBe(50_000n);
    expect(usdcAmountToMicroUnits('1')).toBe(1_000_000n);
    expect(usdcAmountToMicroUnits('1.000001')).toBe(1_000_001n);
    expect(() => usdcAmountToMicroUnits('0.0000001')).toThrow('invalid_usdc_amount');
  });

  it('rejects mainnet RPC URLs', () => {
    expect(() => assertDevnetRpcUrl('https://api.mainnet-beta.solana.com')).toThrow('mainnet_rpc_url_forbidden');
  });

  it('validates devnet USDC challenges and spend caps', () => {
    const { path } = tempKeypairPath();
    const validated = validateDevnetUsdcChallenge(challenge(), config(path));
    expect(validated.amountMicroUnits).toBe(50_000n);
    expect(validated.maxUsdcMicroUnits).toBe(150_000n);
    expect(() => validateDevnetUsdcChallenge(challenge({ amount: '0.20' }), config(path))).toThrow('devnet_usdc_spend_cap_exceeded');
    expect(() => validateDevnetUsdcChallenge(challenge({ network: 'solana-mainnet-beta' }), config(path))).toThrow('x402_challenge_not_solana_devnet');
    expect(() => validateDevnetUsdcChallenge(challenge({ endpoint: 'https://evil.example.test/pay' }), config(path))).toThrow('specialist_endpoint_not_allowlisted');
  });

  it('prepares a non-mutating readiness response without exposing secret key material', async () => {
    const { path, keypair } = tempKeypairPath();
    const result = await prepareDevnetUsdcPayment({ challenge: challenge(), config: config(path), client: fakeClient() });
    expect(result.ready).toBe(true);
    expect(result.payer).toBe(keypair.publicKey.toBase58());
    expect(result.spend.amountMicroUnits).toBe('50000');
    expect(JSON.stringify(result)).not.toContain(String(keypair.secretKey[0]));
  });

  it('reports insufficient balances without submitting transfer', async () => {
    const { path } = tempKeypairPath();
    const submitUsdcTransfer = jest.fn();
    const result = await prepareDevnetUsdcPayment({
      challenge: challenge(),
      config: config(path),
      client: fakeClient({
        async getSolBalanceLamports() { return 1; },
        async getUsdcBalanceMicroUnits() { return 1n; },
        submitUsdcTransfer,
      }),
    });
    expect(result.ready).toBe(false);
    expect(result.reasons).toContain('insufficient_sol_for_fees:1<5000');
    expect(result.reasons).toContain('insufficient_usdc:1<50000');
    expect(submitUsdcTransfer).not.toHaveBeenCalled();
  });

  it('executes only with the approval phrase and returns an x402 payment receipt', async () => {
    const { path, keypair } = tempKeypairPath();
    await expect(executeDevnetUsdcPayment({
      challenge: challenge(),
      config: config(path),
      client: fakeClient(),
      // @ts-expect-error exercising runtime guard
      approvalPhrase: 'NOPE',
    })).rejects.toThrow('missing_devnet_x402_specialist_call_approval_phrase');

    const receipt = await executeDevnetUsdcPayment({
      challenge: challenge(),
      config: config(path),
      client: fakeClient(),
      approvalPhrase: 'EXECUTE_DEVNET_X402_SPECIALIST_CALL',
    });
    expect(receipt.network).toBe('solana-devnet');
    expect(receipt.currency).toBe('USDC');
    expect(receipt.signature).toBe('devnet-usdc-signature');
    expect(receipt.payer).toBe(keypair.publicKey.toBase58());
    expect(receipt.mint).toBe(new PublicKey(usdcMint).toBase58());
  });

  it('creates a Solana adapter that reads balances and computes the destination token account without submitting', async () => {
    const owner = Keypair.generate().publicKey;
    const mint = new PublicKey(usdcMint);
    const connection = {
      async getBalance(publicKey: PublicKey) {
        expect(publicKey.toBase58()).toBe(owner.toBase58());
        return 12345;
      },
      async getAccountInfo() { return null; },
      async getTokenAccountBalance() { throw new Error('should not read token balance for missing ATA'); },
    } as any;
    const client = createSolanaDevnetUsdcPaymentClient(connection);
    await expect(client.getSolBalanceLamports(owner)).resolves.toBe(12345);
    await expect(client.getUsdcBalanceMicroUnits(owner, mint)).resolves.toBe(0n);
    await expect(client.getOrCreateDestinationTokenAccount(new PublicKey(payTo), mint)).resolves.toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('parses hosted x402 request headers into strict challenges', () => {
    const parsed = challengeFromX402RequestHeader(JSON.stringify({
      version: '1',
      network: 'solana-devnet',
      payTo,
      amount: '0.05',
      currency: 'USDC',
      endpoint,
      nonce: 'nonce-456',
    }));
    expect(parsed.network).toBe('solana-devnet');
    expect(parsed.payTo).toBe(payTo);
    expect(parsed.nonce).toBe('nonce-456');
  });
});
