import { MemCacheClient } from '../cacheClient/MemCacheClient';
import { RedisClient } from '../cacheClient/RedisClient';

export type RateProviderType = 'memory' | 'redis';

export type RequestData = {
  requestCount: number;
  windowStartTimestamp: number;
};

export type RateLimitOptions = {
  windowSeconds?: number;
  maxRequests?: number;
  prefix?: string;
};

export class RateLimitProvider {
  private maxWindowTimeMs: number;
  private maxRequests: number;
  private client: MemCacheClient | RedisClient;
  private prefix: string;

  constructor(client?: MemCacheClient | RedisClient, options?: RateLimitOptions) {
    this.client = client ?? MemCacheClient.getInstance();
    this.prefix = options?.prefix ?? 'rememcache-rate-limit:';
    this.maxWindowTimeMs = (options?.windowSeconds ?? 60) * 1000;
    this.maxRequests = options?.maxRequests ?? 60;
  }

  public async getRequestData(userId: string): Promise<RequestData | undefined> {
    const raw = await this.client.get(`${this.prefix}${userId}`);
    if (!raw) return undefined;
    return JSON.parse(raw) as RequestData;
  }

  public async isWithinLimits(userId: string): Promise<boolean> {
    const now = Date.now();

    let requestData = await this.getRequestData(userId);
    if (!requestData) {
      requestData = { requestCount: 0, windowStartTimestamp: now };
    }

    if (now - requestData.windowStartTimestamp >= this.maxWindowTimeMs) {
      requestData.requestCount = 0;
      requestData.windowStartTimestamp = now;
    }

    if (requestData.requestCount >= this.maxRequests) {
      await this.client.set(`${this.prefix}${userId}`, JSON.stringify(requestData));
      return false;
    }

    requestData.requestCount += 1;
    await this.client.set(`${this.prefix}${userId}`, JSON.stringify(requestData));
    return true;
  }

  public isAvailable(): boolean {
    return this.client.isAvailable();
  }

  /**
   * Reset request counters for a user by deleting the stored entry.
   */
  public async reset(userId: string): Promise<void> {
    await this.client.delete(`${this.prefix}${userId}`);
  }
}

export const getRateLimitProvider = (
  type: RateProviderType = 'memory',
  options?: RateLimitOptions,
) => {
  if (type === 'redis') {
    return new RateLimitProvider(RedisClient.getInstance(), options);
  }
  return new RateLimitProvider(MemCacheClient.getInstance(), options);
};

export default RateLimitProvider;
