import { Redis } from "@upstash/redis";
import { BCRAResponse } from "./bcra-fetch";

let redis: Redis | null = null;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = Redis.fromEnv();
  }
} catch {
  console.warn("Redis not available during build/static generation");
}

const REDIS_TTL = 7 * 24 * 60 * 60;
const REDIS_FALLBACK_PREFIX = "bcra_fallback:";

function isStaticGeneration(): boolean {
  return (
    !redis ||
    (typeof window === "undefined" && process.env.NODE_ENV !== "development")
  );
}

export async function setRedisCache(
  key: string,
  data: BCRAResponse,
): Promise<void> {
  if (isStaticGeneration() || !redis) {
    return;
  }

  try {
    const redisKey = `${REDIS_FALLBACK_PREFIX}${key}`;
    await redis.setex(redisKey, REDIS_TTL, JSON.stringify(data));
  } catch (error) {
    console.warn(
      "Failed to cache data in Redis (non-critical):",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function getRedisCache(key: string): Promise<BCRAResponse | null> {
  if (isStaticGeneration() || !redis) {
    return null;
  }

  try {
    const redisKey = `${REDIS_FALLBACK_PREFIX}${key}`;
    const cachedData = await redis.get(redisKey);

    if (cachedData) {
      const parsedData =
        typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
      return parsedData as BCRAResponse;
    }

    return null;
  } catch (error) {
    console.warn(
      "Failed to retrieve data from Redis (non-critical):",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
