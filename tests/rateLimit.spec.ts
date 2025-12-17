import { describe, it, expect, beforeEach } from 'vitest';
import { getRateLimitProvider } from '../src/cacheProvider/cacheProvider';

describe('RateLimitProvider', () => {

  it('creates isolated rate limiters with different prefixes', async () => {
    const a = getRateLimitProvider('memory', { prefix: 'ra:' });
    const b = getRateLimitProvider('memory', { prefix: 'rb:' });

    // both under limits initially
    expect(await a.isWithinLimits('u')).toBe(true);
    expect(await b.isWithinLimits('u')).toBe(true);

    // increment a twice more to make a's counter higher
    await a.isWithinLimits('u');
    await a.isWithinLimits('u');

    // b remains unaffected
    expect(await b.isWithinLimits('u')).toBe(true);
  });

  it('honors max requests and returns false when exceeded', async () => {
    const r = getRateLimitProvider('memory', { prefix: 'r2:', maxRequests: 2 });

    expect(await r.isWithinLimits('u1')).toBe(true); // 1
    expect(await r.isWithinLimits('u1')).toBe(true); // 2
    expect(await r.isWithinLimits('u1')).toBe(false); // 3 exceeds
  });

  it('resets counters after window expires', async () => {
    const r = getRateLimitProvider('memory', { prefix: 'rw:', maxRequests: 1, windowSeconds: 1 });

    expect(await r.isWithinLimits('u2')).toBe(true); // 1
    expect(await r.isWithinLimits('u2')).toBe(false); // exceeds

    // wait for window to expire
    await new Promise((res) => setTimeout(res, 1100));

    // should be allowed again
    expect(await r.isWithinLimits('u2')).toBe(true);
  });

  it('works with a fake redis client passed directly to provider', async () => {
    const store = new Map<string, string>();
    const fakeClient = {
      async get(k: string) {
        return store.has(k) ? store.get(k)! : null;
      },
      async set(k: string, v: string) {
        store.set(k, v);
      },
      isAvailable() {
        return true;
      },
    };

    const { RateLimitProvider } = await import('../src/cacheProvider/RateLimitProvider');
    const rp = new RateLimitProvider(fakeClient as any, { prefix: 'fr:', maxRequests: 1 });

    expect(await rp.isWithinLimits('user')).toBe(true);
    expect(await rp.isWithinLimits('user')).toBe(false);
  });

  it('reset clears counters so user can make requests immediately', async () => {
    const r = getRateLimitProvider('memory', { prefix: 'rr:', maxRequests: 1 });

    expect(await r.isWithinLimits('u3')).toBe(true);
    expect(await r.isWithinLimits('u3')).toBe(false);

    // reset counters
    await (r as any).reset('u3');

    // should be allowed again immediately
    expect(await r.isWithinLimits('u3')).toBe(true);
  });
});