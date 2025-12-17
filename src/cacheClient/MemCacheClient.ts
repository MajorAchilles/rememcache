import { LRUCache } from 'lru-cache';
import { CacheClient } from './CacheClient';

export type MemCacheClientOptions = {
  recordTTLSeconds?: number;
  maxItems?: number;
  maxSizeInBytes?: number;
};

const defaultMemCacheClientOptions: MemCacheClientOptions = {
  recordTTLSeconds: 60,
  maxItems: 1000,
  maxSizeInBytes: 5242880, // 5 MiB
};

const getApproximateStringSizeInBytes = (str: string): number => {
  return str.length * 2; // Approximate size in bytes (assuming UTF-16)
};

export class MemCacheClient implements CacheClient {
  private cache: LRUCache<string, { value: string; expiresAt: number }>;
  private static instance: MemCacheClient;
  private isReady: boolean = false;
  private recordTTLSeconds: number;
  private maxSizeInBytes: number;

  private constructor(memCacheClientOptions?: Partial<MemCacheClientOptions>) {
    this.cache = new LRUCache<string, { value: string; expiresAt: number }>({
      max: memCacheClientOptions?.maxItems || defaultMemCacheClientOptions.maxItems!,
    });
    this.recordTTLSeconds = memCacheClientOptions?.recordTTLSeconds || defaultMemCacheClientOptions.recordTTLSeconds!;
    this.maxSizeInBytes = memCacheClientOptions?.maxSizeInBytes || defaultMemCacheClientOptions.maxSizeInBytes!;
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
    if (getApproximateStringSizeInBytes(value) > this.maxSizeInBytes) {
      return Promise.reject(new Error('Item size exceeds maximum allowed size for MemCacheClient'));
    }
    this.cache.set(key, { value, expiresAt: Date.now() + (this.recordTTLSeconds * 1000) });
    return Promise.resolve();
  }

  public isAvailable(): boolean {
    return this.isReady;
  }
}

export default MemCacheClient.getInstance();
