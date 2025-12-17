/* eslint-disable */
// Redis runner to exercise Redis-backed provider.
// Usage: npm run run:redis-runner

(async () => {
  console.log('Starting redis runner...');

  const { getProvider, configureRedisClient } = require('./dist/cacheProvider/cacheProvider');
  const { RedisClient } = require('./dist/cacheClient/RedisClient');

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const db = Number(process.env.REDIS_DB || 0);
  const password = process.env.REDIS_PASSWORD || undefined;
  const ttlSec = Number(process.env.REDIS_RECORD_TTL_SECONDS || 1);

  configureRedisClient({ host, port, db, password, recordTTLSeconds: ttlSec, onConnect: () => console.log('Redis: connected'), onError: (e) => console.warn('Redis error', e) });

  const redisClient = RedisClient.getInstance();

  // Wait for connection ready (up to timeout)
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !redisClient.isAvailable()) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!redisClient.isAvailable()) {
    console.warn('Redis client is not available after wait; continuing but operations may be no-ops');
  }

  const provider = getProvider('redis', { prefix: 'runner-redis:' });
  console.log('Using provider with prefix:', provider.keyPrefix ?? '<unknown>');

  const key = 'demo-key';
  await provider.setItem(key, { now: Date.now(), hello: 'redis-world' });
  console.log('Wrote', key);

  const v = await provider.getItem(key);
  console.log('Read', key, '->', v);

  // TTL test: write a key and assert it expires after the configured TTL
  const ttlKey = 'ttl-key';
  console.log('Writing ttl-key with TTL (seconds):', ttlSec);
  await provider.setItem(ttlKey, { now: Date.now(), ttl: true });
  const vttl1 = await provider.getItem(ttlKey);
  console.log('Immediately read ttl-key ->', vttl1);

  console.log(`Waiting ${ttlSec + 1} seconds for TTL to expire...`);
  await new Promise((r) => setTimeout(r, (ttlSec + 1) * 1000));
  const vttl2 = await provider.getItem(ttlKey);
  console.log('After TTL, read ttl-key ->', vttl2);

  console.log('Redis runner complete.');
  process.exit(0);
})();