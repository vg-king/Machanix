import { kv } from '@vercel/kv';
import { Redis } from '@upstash/redis';

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

export function hasPersistentStore() {
  return Boolean(getRedisClient());
}

export async function persistentGet(key) {
  const redis = getRedisClient();
  if (redis) return redis.get(key);

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return kv.get(key);
  }
  return undefined;
}

export async function persistentSet(key, value) {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(key, value);
    return;
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    await kv.set(key, value);
  }
}
