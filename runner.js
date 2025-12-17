/* eslint-disable */
// Simple runner to exercise the in-memory provider.
// Usage: npm run run:runner (this builds the project and runs this script)

(async () => {
  console.log('Starting rememcache runner...');

  // Import the compiled provider from `dist` (build step required).
  const { getProvider, configureMemClient } = require('./dist/cacheProvider/cacheProvider');

  
  console.log('Configuring mem client for demo (10s TTL)');
  configureMemClient({ recordTTLSeconds: 10 });

  const provider = getProvider('memory', { prefix: 'runner:' });
  console.log('Using provider with prefix:', provider.keyPrefix ?? '<unknown>');

  // Demo: set and get
  await provider.setItem('demo-key', { now: Date.now(), hello: 'world' });
  console.log('Wrote demo-key');

  const v = await provider.getItem('demo-key');
  console.log('Read demo-key ->', v);

  // Wait 1 second and read again
  await new Promise((r) => setTimeout(r, 1000));
  const v2 = await provider.getItem('demo-key');
  console.log('Read demo-key after 1s ->', v2);

  console.log('Runner complete.');
})();