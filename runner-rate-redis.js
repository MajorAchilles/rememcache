/* eslint-disable */
// Redis rate limiter runner
// Usage: npm run run:rate-redis-runner

(async () => {
  console.log('Starting redis rate-limit runner...');

  const { getRateLimitProvider, configureRedisClient } = require('./dist/cacheProvider/cacheProvider');
  const { RedisClient } = require('./dist/cacheClient/RedisClient');

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const db = Number(process.env.REDIS_DB || 0);
  const password = process.env.REDIS_PASSWORD || undefined;

  const windowSeconds = Number(process.env.RATE_LIMITING_WINDOW_SECONDS || 3);
  const maxRequests = Number(process.env.RATE_LIMITING_MAX_REQUESTS || 2);

  // Configure underlying redis client; set a record TTL longer than the window
  configureRedisClient({ host, port, db, password, recordTTLSeconds: Math.max(30, windowSeconds * 3), onConnect: () => console.log('Redis: connected'), onError: (e) => console.warn('Redis error', e) });

  const redisClient = RedisClient.getInstance();

  // Wait up to 5s for connection
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !redisClient.isAvailable()) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!redisClient.isAvailable()) {
    console.warn('Redis client is not available after wait; continuing but operations may be no-ops');
  }

  const rl = getRateLimitProvider('redis', { prefix: 'runner-rl-redis:', windowSeconds, maxRequests });
  console.log('Using redis rate limiter with prefix runner-rl-redis:, windowSeconds=', windowSeconds, 'maxRequests=', maxRequests);

  // Perform requests
  for (let i = 1; i <= maxRequests + 1; i++) {
    const ok = await rl.isWithinLimits('user1');
    console.log(`Request ${i}: ${ok ? 'allowed' : 'blocked'}`);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Reset counters via delete and show that user can make requests immediately
  console.log('Resetting counters for user1 via reset()...');
  await rl.reset('user1');
  const okAfterReset = await rl.isWithinLimits('user1');
  console.log('After reset, request allowed:', okAfterReset);

  console.log('Waiting for window to expire...');
  await new Promise((r) => setTimeout(r, (windowSeconds + 1) * 1000));

  const okAfter = await rl.isWithinLimits('user1');
  console.log('After window, request allowed:', okAfter);

  console.log('Redis rate-limit runner complete.');
  process.exit(0);
})();