import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    redisClient = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }
  return redisClient;
}

// Legacy export for backwards compatibility
export const redis = {
  get: async (key: string) => {
    try {
      return await getRedis().get(key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string, ex?: string, seconds?: number) => {
    try {
      if (ex === 'EX' && seconds) {
        return await getRedis().set(key, value, 'EX', seconds);
      }
      return await getRedis().set(key, value);
    } catch {
      return null;
    }
  },
  del: async (key: string) => {
    try {
      return await getRedis().del(key);
    } catch {
      return null;
    }
  },
};

export async function connectRedis(): Promise<void> {
  try {
    await getRedis().connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    
  }
}
