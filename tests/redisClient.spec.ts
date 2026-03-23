import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redisCtorMock } = vi.hoisted(() => {
  return {
    redisCtorMock: vi.fn(),
  };
});

vi.mock('ioredis', () => {
  class MockIORedis {
    constructor(config: unknown) {
      redisCtorMock(config);
    }

    on() {
      return this;
    }
  }

  return { default: MockIORedis };
});

describe('RedisClient TLS wiring', () => {
  beforeEach(() => {
    vi.resetModules();
    redisCtorMock.mockClear();
  });

  it('passes tls options to ioredis when enableTLS is true', async () => {
    const { RedisClient } = await import('../src/cacheClient/RedisClient');
    redisCtorMock.mockClear();

    RedisClient.configure({
      host: 'cache.example.com',
      port: 6380,
      db: 0,
      enableTLS: true,
      tls: { rejectUnauthorized: false, servername: 'cache.example.com' },
    });

    expect(redisCtorMock).toHaveBeenCalledTimes(1);
    const redisConfig = redisCtorMock.mock.calls[0][0] as Record<string, unknown>;
    expect(redisConfig.tls).toEqual({ rejectUnauthorized: false, servername: 'cache.example.com' });
  });

  it('does not enable tls when tls options are provided but enableTLS is undefined', async () => {
    const { RedisClient } = await import('../src/cacheClient/RedisClient');
    redisCtorMock.mockClear();

    RedisClient.configure({
      host: 'cache.example.com',
      port: 6380,
      db: 0,
      tls: { rejectUnauthorized: false, servername: 'cache.example.com' },
    });

    expect(redisCtorMock).toHaveBeenCalledTimes(1);
    const redisConfig = redisCtorMock.mock.calls[0][0] as Record<string, unknown>;
    expect(redisConfig.tls).toBeUndefined();
  });

  it('enables tls with default options when enableTLS is true and tls options are not provided', async () => {
    const { RedisClient } = await import('../src/cacheClient/RedisClient');
    redisCtorMock.mockClear();

    RedisClient.configure({
      host: 'cache.example.com',
      port: 6380,
      db: 0,
      enableTLS: true,
    });

    expect(redisCtorMock).toHaveBeenCalledTimes(1);
    const redisConfig = redisCtorMock.mock.calls[0][0] as Record<string, unknown>;
    expect(redisConfig.tls).toEqual({});
  });

  it('does not pass tls options to ioredis when enableTLS is false', async () => {
    const { RedisClient } = await import('../src/cacheClient/RedisClient');
    redisCtorMock.mockClear();

    RedisClient.configure({
      host: 'cache.example.com',
      port: 6379,
      db: 0,
      enableTLS: false,
      tls: { rejectUnauthorized: false },
    });

    expect(redisCtorMock).toHaveBeenCalledTimes(1);
    const redisConfig = redisCtorMock.mock.calls[0][0] as Record<string, unknown>;
    expect(redisConfig.tls).toBeUndefined();
  });
});
