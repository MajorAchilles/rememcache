# rememcache

A small TypeScript library for simple in-memory and Redis-backed caching with logical partitioning via prefixed providers.

## Features

- Singletons for underlying clients: one in-memory client and one Redis client
- Configure clients at app startup using `configureMemClient` and `configureRedisClient`
- Create multiple `Provider` instances (memory or redis) that each add a `prefix` to keys so you can logically partition data
- Type-safe `getItem<T>()` and `setItem<T>()` methods

---

## Install

npm install

## Quickstart

### 1) Configure underlying clients (optional)

Call these early in your app initialization to override defaults:

```ts
import { configureRedisClient, configureMemClient } from './src/cacheProvider/cacheProvider';

configureRedisClient({ host: '127.0.0.1', port: 6379, recordTTLSeconds: 600 });
configureMemClient({ recordTTLSeconds: 120, maxItems: 500 });
```

If you don't call configure, the library will use sensible defaults and singletons will be created on first use.

### 2) Create providers (one provider per logical prefix)

Providers wrap the shared client but keep their own prefix. Use `getProvider` to create providers easily:

```ts
import { getProvider } from './src/cacheProvider/cacheProvider';

const tenantA = getProvider('redis', { prefix: 'tenantA:' });
const tenantB = getProvider('redis', { prefix: 'tenantB:' });
const localStore = getProvider('memory', { prefix: 'local:' });

// Type-safe operations
await tenantA.setItem<User>('u1', { id: 'u1', name: 'Alice' });
const alice = await tenantA.getItem<User>('u1');

// tenantB won't see tenantA's data
const maybeAlice = await tenantB.getItem<User>('u1'); // undefined

// Memory provider
await localStore.setItem('temp', { ts: Date.now() });
```

### Run the demo runner (local)

A simple runner is included to exercise the in-memory provider. Build then run it:

```bash
npm run run:runner
```

This will build the project and run `runner.js`, which:

- configures the memory client TTL for the demo
- creates a `memory` provider with prefix `runner:`
- writes and reads a demo key and prints the results


### 3) Direct provider classes (optional)

You can instantiate provider classes directly if you prefer:

```ts
import { RedisProvider, MemProvider } from './src/cacheProvider/cacheProvider';

const p = new RedisProvider(undefined, 'custom-prefix:');
await p.setItem('k', { a: 1 });
```

## API

- `configureRedisClient(options?: Partial<RedisClientOptions>): void`
- `configureMemClient(options?: Partial<MemCacheClientOptions>): void`
- `getProvider(type: 'redis' | 'memory', config?: { prefix?: string }): Provider`
- Provider methods:
  - `getItem<T>(key: string): Promise<T | undefined>`
  - `setItem<T>(key: string, value: T): Promise<void>`
  - `isAvailable(): boolean`

## Notes

- Underlying clients are singletons — calling `configure*` recreates the singleton before provider creation.
- Providers are lightweight wrappers and safe to create multiple times; they only encapsulate a prefix and reference the shared client.

---

## Rate limiting

You can create rate limiting providers that track request counts per user and windows with a configurable maximum and time window (via options).

Example:

```ts
import { getRateLimitProvider } from './src/cacheProvider/RateLimitProvider';

// Example: window=30s, maxRequests=10
const rl = getRateLimitProvider('memory', { prefix: 'rl:tenantA:', windowSeconds: 30, maxRequests: 10 });

const ok = await rl.isWithinLimits('user123');

```

Options:

- `windowSeconds` (seconds)
- `maxRequests`
### Rate limiter demo runner

A runner is included to demonstrate rate limiting behavior locally:

```bash
npm run run:rate-runner
```

This builds and runs `runner-rate-limit.js`, which exercises a memory-based rate limiter and prints whether requests are allowed or blocked.

---
