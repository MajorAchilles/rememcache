// Provider factory and helpers
import { MemCacheClient, MemCacheClientOptions } from '../cacheClient/MemCacheClient';
import { RedisClient, RedisClientOptions } from '../cacheClient/RedisClient';

export interface Provider {
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
  deleteItem(key: string): Promise<void>;
  isAvailable(): boolean;
}

export type ProviderType = 'memory' | 'redis';
export type ProviderConfig = { prefix?: string };

const DEFAULT_MEM_PREFIX = 'rememcache-mem:';
const DEFAULT_REDIS_PREFIX = 'rememcache-redis:';

export class MemProvider implements Provider {
  private client: MemCacheClient;
  constructor(client?: MemCacheClient, private prefix: string = DEFAULT_MEM_PREFIX) {
    this.client = client ?? MemCacheClient.getInstance();
  }

  public get keyPrefix(): string {
    return this.prefix;
  }

  public async getItem<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(`${this.prefix}${key}`);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    await this.client.set(`${this.prefix}${key}`, JSON.stringify(value));
  }

  public async deleteItem(key: string): Promise<void> {
    await this.client.delete(`${this.prefix}${key}`);
  }

  public isAvailable(): boolean {
    return this.client.isAvailable();
  }
}

export class RedisProvider implements Provider {
  private client: RedisClient;
  constructor(client?: RedisClient, private prefix: string = DEFAULT_REDIS_PREFIX) {
    this.client = client ?? RedisClient.getInstance();
  }

  public get keyPrefix(): string {
    return this.prefix;
  }

  public async getItem<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(`${this.prefix}${key}`);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    await this.client.set(`${this.prefix}${key}`, JSON.stringify(value));
  }

  public async deleteItem(key: string): Promise<void> {
    await this.client.delete(`${this.prefix}${key}`);
  }

  public isAvailable(): boolean {
    return this.client.isAvailable();
  }
}

export const getProvider = (type: ProviderType = 'redis', config?: ProviderConfig): Provider => {
  const prefix = config?.prefix;
  if (type === 'redis') {
    return new RedisProvider(undefined, prefix ?? DEFAULT_REDIS_PREFIX);
  }
  return new MemProvider(undefined, prefix ?? DEFAULT_MEM_PREFIX);
};

// Allow external configuration of underlying clients before creating providers
export const configureMemClient = (options?: Partial<MemCacheClientOptions>) => {
  MemCacheClient.configure(options);
};

export const configureRedisClient = (options?: Partial<RedisClientOptions>) => {
  RedisClient.configure(options);
};


export { RateLimitProvider, getRateLimitProvider } from './RateLimitProvider';

export default getProvider;
