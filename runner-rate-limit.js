/* eslint-disable */
// Demo runner for the RateLimitProvider
// Usage: npm run run:rate-runner

(async () => {
  console.log('Starting rate limit runner...');

  // Import the compiled rate limit provider from `dist` (build step required).
  const { getRateLimitProvider } = require('./dist/cacheProvider/RateLimitProvider');

  // Use explicit options (no env vars required)
  const opts = { maxRequests: Number(process.env.RATE_LIMITING_MAX_REQUESTS) || 2, windowSeconds: Number(process.env.RATE_LIMITING_WINDOW) || 5, prefix: 'runner-rl:' };
  const rl = getRateLimitProvider('memory', opts);
  console.log('Using rate limiter with prefix', opts.prefix, 'and limits', opts.maxRequests, 'per', opts.windowSeconds, 'seconds');

  for (let i = 1; i <= 4; i++) {
    const ok = await rl.isWithinLimits('u1');
    console.log(`Request ${i}: ${ok ? 'allowed' : 'blocked'}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('Waiting for window to expire...');
  await new Promise((r) => setTimeout(r, (opts.windowSeconds + 1) * 1000));

  const okAfter = await rl.isWithinLimits('u1');
  console.log('After window, request allowed:', okAfter);

  console.log('Rate limit runner complete.');
})();