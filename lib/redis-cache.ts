import { BCRAResponse } from "./bcra-fetch";

async function resolveRedis() {
  const hasEnv =
    typeof process !== "undefined" &&
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasEnv) return null;
  try {
    const mod = await import("@upstash/redis");
    return mod.Redis.fromEnv();
  } catch {
    return null;
  }
}

const REDIS_TTL = 7 * 24 * 60 * 60;
const REDIS_FALLBACK_PREFIX = "";

export async function setRedisCache(
  key: string,
  data: BCRAResponse,
): Promise<void> {
  const redis = await resolveRedis();
  if (!redis) {
    console.warn("Redis not configured - data will not be cached for fallback");
    return;
  }

  try {
    const redisKey = key.startsWith("bcra:")
      ? key
      : `${REDIS_FALLBACK_PREFIX}${key}`;
    await redis.setex(redisKey, REDIS_TTL, JSON.stringify(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to cache data in Redis (non-critical): ${message}`);
  }
}

export async function getRedisCache(key: string): Promise<BCRAResponse | null> {
  const redis = await resolveRedis();
  if (!redis) {
    console.warn("Redis not configured - cannot retrieve fallback data");
    return null;
  }

  try {
    const redisKey = key.startsWith("bcra:")
      ? key
      : `${REDIS_FALLBACK_PREFIX}${key}`;
    const cachedData = await redis.get(redisKey);

    if (cachedData) {
      const parsedData =
        typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
      return parsedData as BCRAResponse;
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to retrieve fallback data from Redis: ${message}`);
    return null;
  }
}
