import { LRUCache } from 'lru-cache';
import { CacheClient } from './CacheClient';

export type MemCacheClientOptions = {
  recordTTLSeconds?: number;
  maxItems?: number;
};

const defaultMemCacheClientOptions: MemCacheClientOptions = {
  recordTTLSeconds: 60,
  maxItems: 1000,
};

export class MemCacheClient implements CacheClient {
  private cache: LRUCache<string, { value: string; expiresAt: number }>;
  private static instance: MemCacheClient;
  private isReady: boolean = false;
  private recordTTLSeconds: number;

  private constructor(memCacheClientOptions?: Partial<MemCacheClientOptions>) {
    this.cache = new LRUCache<string, { value: string; expiresAt: number }>({
      max: memCacheClientOptions?.maxItems || defaultMemCacheClientOptions.maxItems!,
    });
    this.recordTTLSeconds = memCacheClientOptions?.recordTTLSeconds || defaultMemCacheClientOptions.recordTTLSeconds!;
    this.isReady = true;
  }

  public static getInstance(): MemCacheClient {
    if (!MemCacheClient.instance) {
      MemCacheClient.instance = new MemCacheClient();
    }
    return MemCacheClient.instance;
  }

  /**
   * Re-create the singleton instance with provided options (useful for configuration)
   */
  public static configure(memCacheClientOptions?: Partial<MemCacheClientOptions>): void {
    MemCacheClient.instance = new MemCacheClient(memCacheClientOptions);
  }

  public async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return Promise.resolve(null);
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value);
  }

  public async set(key: string, value: string): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + (this.recordTTLSeconds * 1000) });
    return Promise.resolve();
  }

  public isAvailable(): boolean {
    return this.isReady;
  }
}

export default MemCacheClient.getInstance();
