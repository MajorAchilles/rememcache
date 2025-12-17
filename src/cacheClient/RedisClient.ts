import IORedis from 'ioredis';
import { CacheClient } from './CacheClient';

export type RedisClientOptions = {
  host: string;
  port: number;
  db: number;
  password?: string;
  recordTTLSeconds?: number;
  retryStrategy?: (times: number) => number | null;
  onConnect?: () => void;
  onError?: (err: Error) => void;
};

const defaultRedisClientOptions: RedisClientOptions = {
  host: '127.0.0.1',
  port: 6379,
  db: 0,
  password: undefined,
  recordTTLSeconds: 300,
  retryStrategy: (times: number) => {
    const maxDelay = 20000; // 20 seconds
    const delay = Math.min(times * 500, maxDelay);
    return delay;
  },
  onConnect: () => {
      console.info('Connected to Redis server');
  },
  onError: (err) => {
    console.warn('Redis connection error:', err);
  },
};

export class RedisClient implements CacheClient {
  private static instance: RedisClient;
  private ioRedisClient: IORedis;
  private isConnectionReady: boolean = false;
  private recordTTLSeconds: number;

  private constructor(redisClientOptions?: Partial<RedisClientOptions>) {
    const redisConfig = {
      host: redisClientOptions?.host || defaultRedisClientOptions.host,
      port: redisClientOptions?.port || defaultRedisClientOptions.port,
      db: redisClientOptions?.db || defaultRedisClientOptions.db,
      password: redisClientOptions?.password || defaultRedisClientOptions.password,
      retryStrategy: redisClientOptions?.retryStrategy || defaultRedisClientOptions.retryStrategy,
    };
    this.recordTTLSeconds = redisClientOptions?.recordTTLSeconds || defaultRedisClientOptions.recordTTLSeconds!;
    this.ioRedisClient = new IORedis(redisConfig);

    this.ioRedisClient.on('error', (err) => {
      this.isConnectionReady = false;
      redisClientOptions?.onError && redisClientOptions.onError(err);
    });

    this.ioRedisClient.on('connect', () => {
      this.isConnectionReady = true;
      redisClientOptions?.onConnect && redisClientOptions.onConnect();
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Re-create the singleton instance with provided options (useful for configuration)
   */
  public static configure(redisClientOptions?: Partial<RedisClientOptions>): void {
    RedisClient.instance = new RedisClient(redisClientOptions);
  }

  public isAvailable(): boolean {
    return this.isConnectionReady;
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isConnectionReady) {
      return Promise.resolve(null);
    }

    return await this.ioRedisClient.get(key);
  }

  public async set(key: string, value: string): Promise<void> {
    if (!this.isConnectionReady) {
      return Promise.resolve();
    }

    const ttl = Number(this.recordTTLSeconds);
    await this.ioRedisClient.set(key, value, 'EX', ttl);
    return Promise.resolve();
  }
}

export default RedisClient.getInstance();
