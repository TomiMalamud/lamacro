import https, { RequestOptions } from "https";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 60, // Maximum requests per window
  timeWindow: 60 * 1000, // Time window in milliseconds (1 minute)
  requestQueue: [] as (() => void)[],
  requestCount: 0,
  lastReset: Date.now()
};

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  failureThreshold: 5, // Number of failures before opening circuit
  resetTimeout: 60 * 1000, // Time before attempting to close circuit (1 minute)
  failures: 0,
  lastFailure: 0,
  isOpen: false
};

// Type definitions for BCRA API responses
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

// Loading and error states
export type BCRAData = {
  loading: boolean;
  error: string | null;
  data: BCRAVariable[];
};

// Variable groups for dashboard organization
export const VARIABLE_GROUPS = {
  KEY_METRICS: [1, 4, 5, 6, 15, 27, 28, 29], // Selected key metrics
  INTEREST_RATES: [6, 7, 8, 9, 10, 11, 12, 13, 14, 34, 35, 40, 41, 160, 161, 162],
  EXCHANGE_RATES: [4, 5, 84],
  INFLATION: [27, 28, 29, 30, 31, 32],
  RESERVES: [1, 74, 75, 76, 77],
  MONETARY_BASE: [15, 16, 17, 18, 19, 46, 64, 71, 72, 73]
};

export function formatNumber(value: number, decimals?: number): string {
  return new Intl.NumberFormat('es-AR', {
    ...(decimals !== undefined && {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR').format(date);
}

// Enhanced cache interface
interface CacheEntry {
  timestamp: number;
  data: BCRAResponse;
  error?: Error;
}

// Cache configuration
const CACHE_TTL = 43200 * 1000; // 12 hours in milliseconds
const ERROR_CACHE_TTL = 300 * 1000; // 5 minutes for error caching
const cache: { [key: string]: CacheEntry } = {};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Rate limiter implementation
 */
function checkRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    
    // Reset counter if time window has passed
    if (now - RATE_LIMIT.lastReset >= RATE_LIMIT.timeWindow) {
      RATE_LIMIT.requestCount = 0;
      RATE_LIMIT.lastReset = now;
    }

    // If under rate limit, resolve immediately
    if (RATE_LIMIT.requestCount < RATE_LIMIT.maxRequests) {
      RATE_LIMIT.requestCount++;
      resolve();
      return;
    }

    // Queue the request
    RATE_LIMIT.requestQueue.push(() => {
      RATE_LIMIT.requestCount++;
      resolve();
    });

    // Set timeout to process queue
    setTimeout(() => {
      const nextRequest = RATE_LIMIT.requestQueue.shift();
      if (nextRequest) nextRequest();
    }, RATE_LIMIT.timeWindow - (now - RATE_LIMIT.lastReset));
  });
}

/**
 * Circuit breaker check
 */
function checkCircuitBreaker(): void {
  if (!CIRCUIT_BREAKER.isOpen) return;

  const now = Date.now();
  if (now - CIRCUIT_BREAKER.lastFailure >= CIRCUIT_BREAKER.resetTimeout) {
    CIRCUIT_BREAKER.isOpen = false;
    CIRCUIT_BREAKER.failures = 0;
    return;
  }

  throw new Error('Circuit breaker is open - too many recent failures');
}

/**
 * Input validation for API parameters
 */
function validateParams(variableId?: number, desde?: string, hasta?: string, offset?: number, limit?: number): void {
  if (variableId && (!Number.isInteger(variableId) || variableId <= 0)) {
    throw new Error('Invalid variable ID');
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (desde && !dateRegex.test(desde)) throw new Error('Invalid desde date format');
  if (hasta && !dateRegex.test(hasta)) throw new Error('Invalid hasta date format');
  
  if (offset && (!Number.isInteger(offset) || offset < 0)) throw new Error('Invalid offset');
  if (limit && (!Number.isInteger(limit) || limit <= 0 || limit > 3000)) throw new Error('Invalid limit');
}

/**
 * Enhanced helper function with retry logic and circuit breaker
 */
async function makeBCRARequest(
  options: RequestOptions,
  errorMessage: string,
  retryCount = 0
): Promise<BCRAResponse> {
  try {
    // Check circuit breaker
    checkCircuitBreaker();
    
    // Apply rate limiting
    await checkRateLimit();

    return new Promise((resolve, reject) => {
      const req = https.get(options, (res) => {
        if (res.statusCode === 401) {
          const error = new Error("BCRA API unauthorized access (401)");
          console.error("UNAUTHORIZED: BCRA API returned 401");
          CIRCUIT_BREAKER.failures++;
          CIRCUIT_BREAKER.lastFailure = Date.now();
          if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
            CIRCUIT_BREAKER.isOpen = true;
          }
          return reject(error);
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            // Reset circuit breaker on success
            CIRCUIT_BREAKER.failures = 0;
            resolve(jsonData);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            reject(new Error(errorMessage));
          }
        });

        res.on("error", (error) => {
          console.error("Response error:", error);
          reject(new Error(errorMessage));
        });
      });

      req.on("error", (error) => {
        console.error("Request error:", error);
        reject(new Error(errorMessage));
      });

      req.on("timeout", () => {
        console.error("Request timed out");
        req.destroy();
        reject(new Error(errorMessage));
      });

      // Set a reasonable timeout
      req.setTimeout(15000);
    });
  } catch (error) {
    // Handle retries
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return makeBCRARequest(options, errorMessage, retryCount + 1);
    }
    
    // Update circuit breaker
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
      CIRCUIT_BREAKER.isOpen = true;
    }
    
    throw error;
  }
}

/**
 * Directly fetches data from BCRA API using Node.js native https
 * This bypasses the internal API route to avoid server component to API route issues
 */
export async function fetchBCRADirect(): Promise<BCRAResponse> {
  const cacheKey = "BCRADirect";
  
  // Check cache including error cache
  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const origin = "https://bcraenvivo.vercel.app";
  const options: RequestOptions = {
    hostname: "api.bcra.gob.ar",
    path: "/estadisticas/v3.0/monetarias",
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      Origin: origin,
      Referer: origin,
      Host: "api.bcra.gob.ar",
      "Content-Language": "es-AR",
      "X-Forwarded-For": "190.191.237.1",
      "CF-IPCountry": "AR",
      Pragma: "no-cache",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site"
    },
    timeout: 15000,
    rejectUnauthorized: false
  };

  try {
    const data = await makeBCRARequest(options, "Failed to parse BCRA data");
    cache[cacheKey] = { timestamp: Date.now(), data };
    return data;
  } catch (error) {
    // Cache errors to prevent hammering failing endpoints
    cache[cacheKey] = { 
      timestamp: Date.now(), 
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error))
    };
    throw error;
  }
}

/**
 * Fetches time series data for a specific variable with optional parameters
 * @param variableId The ID of the variable to fetch
 * @param desde Optional start date in YYYY-MM-DD format
 * @param hasta Optional end date in YYYY-MM-DD format
 * @param offset Optional offset for pagination (default 0)
 * @param limit Optional limit for results (default 1000, max 3000)
 * @returns Promise with the time series data
 */
export async function fetchVariableTimeSeries(
  variableId: number,
  desde?: string,
  hasta?: string,
  offset: number = 0,
  limit: number = 1000
): Promise<BCRAResponse> {
  // Validate input parameters
  validateParams(variableId, desde, hasta, offset, limit);

  const cacheKey = `BCRA_ts_${variableId}_${desde || ""}_${
    hasta || ""
  }_${offset}_${limit}`;

  // Check cache including error cache
  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const origin = "https://bcraenvivo.vercel.app";
  const queryParams = [];
  if (desde) queryParams.push(`desde=${desde}`);
  if (hasta) queryParams.push(`hasta=${hasta}`);
  if (offset > 0) queryParams.push(`offset=${offset}`);
  if (limit !== 1000) queryParams.push(`limit=${limit}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  
  const options: RequestOptions = {
    hostname: "api.bcra.gob.ar",
    path: `/estadisticas/v3.0/monetarias/${variableId}${queryString}`,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      Origin: origin,
      Referer: origin,
      Host: "api.bcra.gob.ar",
      "Content-Language": "es-AR",
      "X-Forwarded-For": "190.191.237.1",
      "CF-IPCountry": "AR",
      Pragma: "no-cache",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site"
    },
    timeout: 15000,
    rejectUnauthorized: false
  };

  try {
    const data = await makeBCRARequest(
      options,
      "Failed to parse BCRA time series data"
    );
    cache[cacheKey] = { timestamp: Date.now(), data };
    return data;
  } catch (error) {
    // Cache errors to prevent hammering failing endpoints
    cache[cacheKey] = { 
      timestamp: Date.now(), 
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error))
    };
    throw error;
  }
}
