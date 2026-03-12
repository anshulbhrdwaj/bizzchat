import { Redis } from 'ioredis';

let redis: Redis | null = null;

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function getMemoryValue(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function setMemoryValue(key: string, value: string, exSeconds?: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: exSeconds ? Date.now() + exSeconds * 1000 : Infinity,
  });
}

export async function connectRedis(): Promise<void> {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    await redis.connect();
    console.log('✅ Redis connected');
  } catch {
    console.warn('⚠️  Redis unavailable — using in-memory fallback');
    redis = null;
  }
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (redis) {
      try { return await redis.get(key); } catch { /* fall through */ }
    }
    return getMemoryValue(key);
  },

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (redis) {
      try {
        if (exSeconds) await redis.setex(key, exSeconds, value);
        else await redis.set(key, value);
        return;
      } catch { /* fall through */ }
    }
    setMemoryValue(key, value, exSeconds);
  },

  async del(key: string): Promise<void> {
    if (redis) {
      try { await redis.del(key); return; } catch { /* fall through */ }
    }
    memoryStore.delete(key);
  },

  async exists(key: string): Promise<boolean> {
    if (redis) {
      try { return (await redis.exists(key)) === 1; } catch { /* fall through */ }
    }
    return getMemoryValue(key) !== null;
  },
};

export { redis };
