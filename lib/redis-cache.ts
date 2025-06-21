import { Redis } from "@upstash/redis";
import { BCRAResponse } from "./bcra-fetch";

const redis = Redis.fromEnv();

const REDIS_TTL = 7 * 24 * 60 * 60;
const REDIS_FALLBACK_PREFIX = "";

export async function setRedisCache(
  key: string,
  data: BCRAResponse,
): Promise<void> {
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
    console.warn(
      "Failed to cache data in Redis (non-critical):",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function getRedisCache(key: string): Promise<BCRAResponse | null> {
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
    console.error(
      "Failed to retrieve fallback data from Redis:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
