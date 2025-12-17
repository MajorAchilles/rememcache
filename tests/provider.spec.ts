import { describe, it, expect, beforeEach } from 'vitest';
import { getProvider, configureMemClient } from '../src/cacheProvider/cacheProvider';

describe('Providers', () => {

  it('creates isolated providers using different prefixes', async () => {
    const a = getProvider('memory', { prefix: 'a:' });
    const b = getProvider('memory', { prefix: 'b:' });

    await a.setItem('key', { v: 1 });
    const fromA = await a.getItem<{ v: number }>('key');
    const fromB = await b.getItem<{ v: number }>('key');

    expect(fromA).toEqual({ v: 1 });
    expect(fromB).toBeUndefined();
  });

  it('honors mem client configuration (TTL leading to immediate expiry)', async () => {
    // Reconfigure mem client with a TTL that will expire immediately so tests are deterministic
    configureMemClient({ recordTTLSeconds: -1 });

    const p = getProvider('memory', { prefix: 't:' });

    await p.setItem('k', { x: 1 });
    // With recordTTLSeconds = -1, items should be expired immediately
    const got = await p.getItem('k');
    expect(got).toBeUndefined();
  });

  it('redis provider can be used with a custom client (no real redis)', async () => {
    // Create a fake redis client implementing get/set/isAvailable
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

    // import the RedisProvider directly to pass custom client
    const { RedisProvider } = await import('../src/cacheProvider/cacheProvider');
    const r1 = new RedisProvider(fakeClient as any, 'x:');
    const r2 = new RedisProvider(fakeClient as any, 'y:');

    await r1.setItem('k', { a: 1 });
    const a = await r1.getItem('k');
    const b = await r2.getItem('k');

    expect(a).toEqual({ a: 1 });
    expect(b).toBeUndefined();
  });
});
