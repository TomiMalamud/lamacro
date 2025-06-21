import {
  createBCRARequestOptions,
  makeBCRADataRequest,
} from "./bcra-api-helper";
import { getRedisCache } from "./redis-cache";

export interface BCRAVariable {
  idVariable: number;
  descripcion: string;
  categoria: string;
  fecha: string;
  valor: number;
}

export interface BCRAResponse {
  status: number;
  results: BCRAVariable[];
}

export type BCRAData = {
  loading: boolean;
  error: string | null;
  data: BCRAVariable[];
};

export const VARIABLE_GROUPS = {
  KEY_METRICS: [1, 4, 5, 6, 15, 27, 28, 29],
  INTEREST_RATES: [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 34, 35, 40, 41, 160, 161, 162,
  ],
  EXCHANGE_RATES: [4, 5, 84],
  INFLATION: [27, 28, 29, 30, 31, 32],
  RESERVES: [1, 74, 75, 76, 77],
  MONETARY_BASE: [15, 16, 17, 18, 19, 46, 64, 71, 72, 73],
};

interface CacheEntry {
  timestamp: number;
  data: BCRAResponse;
  error?: Error;
}

const CACHE_TTL = 43200 * 1000;
const ERROR_CACHE_TTL = 300 * 1000;
const cache: { [key: string]: CacheEntry } = {};

function validateParams(
  variableId?: number,
  desde?: string,
  hasta?: string,
  offset?: number,
  limit?: number,
): void {
  if (variableId && (!Number.isInteger(variableId) || variableId <= 0)) {
    throw new Error("Invalid variable ID");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (desde && !dateRegex.test(desde))
    throw new Error("Invalid desde date format");
  if (hasta && !dateRegex.test(hasta))
    throw new Error("Invalid hasta date format");

  if (offset && (!Number.isInteger(offset) || offset < 0))
    throw new Error("Invalid offset");
  if (limit && (!Number.isInteger(limit) || limit <= 0 || limit > 3000))
    throw new Error("Invalid limit");
}

export async function fetchBCRADirect(): Promise<BCRAResponse> {
  const cacheKey = "BCRADirect";
  // Use the Redis key that actually exists (with bcra: prefix)
  const redisKey = "bcra:BCRADirect";

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const options = createBCRARequestOptions("/estadisticas/v3.0/monetarias");

  try {
    const data = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA data",
    );
    cache[cacheKey] = { timestamp: Date.now(), data };

    return data;
  } catch (error) {
    const fallbackData = await getRedisCache(redisKey);
    if (fallbackData) {
      return fallbackData;
    }

    cache[cacheKey] = {
      timestamp: Date.now(),
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error)),
    };
    throw error;
  }
}

export async function fetchVariableTimeSeries(
  variableId: number,
  desde?: string,
  hasta?: string,
  offset: number = 0,
  limit: number = 1000,
): Promise<BCRAResponse> {
  validateParams(variableId, desde, hasta, offset, limit);

  const cacheKey = `BCRA_ts_${variableId}_${desde || ""}_${
    hasta || ""
  }_${offset}_${limit}`;

  const redisKey = `bcra:details_${variableId}`;

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const queryParams = [];
  if (desde) queryParams.push(`desde=${desde}`);
  if (hasta) queryParams.push(`hasta=${hasta}`);
  if (offset > 0) queryParams.push(`offset=${offset}`);
  if (limit !== 1000) queryParams.push(`limit=${limit}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const options = createBCRARequestOptions(
    `/estadisticas/v3.0/monetarias/${variableId}${queryString}`,
  );

  try {
    const data = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA time series data",
    );
    cache[cacheKey] = { timestamp: Date.now(), data };

    return data;
  } catch (error) {
    const fallbackData = await getRedisCache(redisKey);
    if (fallbackData) {
      return fallbackData;
    }

    cache[cacheKey] = {
      timestamp: Date.now(),
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error)),
    };
    throw error;
  }
}
