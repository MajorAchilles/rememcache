/* eslint-disable */
// Simple runner to exercise the in-memory provider.
// Usage: npm run run:runner (this builds the project and runs this script)

(async () => {
  console.log('Starting rememcache runner...');

  // Import the compiled provider from `dist` (build step required).
  const { getProvider, configureMemClient } = require('./dist/cacheProvider/cacheProvider');

  
  console.log('Configuring mem client for demo (10s TTL)');
  configureMemClient({ recordTTLSeconds: 2, maxItems: 2, maxSizeInBytes: 128 });

  const provider = getProvider('memory', { prefix: 'runner:' });
  console.log('Using provider with prefix:', provider.keyPrefix ?? '<unknown>');

  // Demo: set and get
  await provider.setItem('demo-key', { now: Date.now(), hello: 'world' });
  await provider.setItem('demo-key2', { now: Date.now(), hello: 'world again!' });
  console.log('Wrote demo-key');

  const v = await provider.getItem('demo-key');
  const v2 = await provider.getItem('demo-key2');
  console.log('Read demo-key ->', v);
  console.log('Read demo-key2 ->', v2);

  // Wait 1 second and read again
  await new Promise((r) => setTimeout(r, 1000));
  const v3 = await provider.getItem('demo-key');
  const v4 = await provider.getItem('demo-key2');
  console.log('Read demo-key after 1s ->', v3);
  console.log('Read demo-key2 after 1s ->', v4);

  await new Promise((r) => setTimeout(r, 3000));
  const v5 = await provider.getItem('demo-key');
  const v6 = await provider.getItem('demo-key2');
  console.log('Read demo-key after total 4s ->', v5);
  console.log('Read demo-key2 after total 4s ->', v6);

  // Demo: deleteItem
  console.log('Testing deleteItem: writing and deleting delete-key');
  await provider.setItem('delete-key', { now: Date.now(), bye: true });
  const beforeDel = await provider.getItem('delete-key');
  console.log('Before delete ->', beforeDel);
  await provider.deleteItem('delete-key');
  const afterDel = await provider.getItem('delete-key');
  console.log('After delete ->', afterDel);


  console.log('Runner complete.');
})();