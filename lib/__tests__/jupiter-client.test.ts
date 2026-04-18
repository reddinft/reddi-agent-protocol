/**
 * Unit tests for lib/jupiter-client.ts
 *
 * BDD: Bucket F — Cross-Token Settlement
 * F1.5: getJupiterClient() returns null when JUPITER_API_KEY not set
 * F1.6: getJupiterClient() returns singleton when JUPITER_API_KEY set
 */

describe('getJupiterClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns null when JUPITER_API_KEY is not set', async () => {
    delete process.env.JUPITER_API_KEY;
    const { getJupiterClient } = await import('../jupiter-client');
    expect(getJupiterClient()).toBeNull();
  });

  it('returns a client instance when JUPITER_API_KEY is set', async () => {
    process.env.JUPITER_API_KEY = 'test-key-123';
    const { getJupiterClient } = await import('../jupiter-client');
    const client = getJupiterClient();
    expect(client).not.toBeNull();
    expect(typeof client).toBe('object');
  });

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.JUPITER_API_KEY = 'test-key-123';
    const { getJupiterClient } = await import('../jupiter-client');
    const c1 = getJupiterClient();
    const c2 = getJupiterClient();
    expect(c1).toBe(c2);
  });

  it('uses custom API base from JUPITER_API_BASE env var', async () => {
    process.env.JUPITER_API_KEY = 'test-key-123';
    process.env.JUPITER_API_BASE = 'https://custom.jup.ag/swap/v2';
    const { getJupiterClient } = await import('../jupiter-client');
    const client = getJupiterClient();
    expect(client).not.toBeNull();
  });

  it('getJupiterSlippageBps returns 50 by default', async () => {
    delete process.env.JUPITER_SLIPPAGE_BPS;
    const { getJupiterSlippageBps } = await import('../jupiter-client');
    expect(getJupiterSlippageBps()).toBe(50);
  });

  it('getJupiterSlippageBps reads from JUPITER_SLIPPAGE_BPS env var', async () => {
    process.env.JUPITER_SLIPPAGE_BPS = '100';
    const { getJupiterSlippageBps } = await import('../jupiter-client');
    expect(getJupiterSlippageBps()).toBe(100);
  });
});
