import https, { RequestOptions } from "https";
import { NextResponse } from "next/server";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 60, // Maximum requests per window
  timeWindow: 60 * 1000, // Time window in milliseconds (1 minute)
  requestQueue: [] as (() => void)[],
  requestCount: 0,
  lastReset: Date.now(),
};

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  failureThreshold: 5, // Number of failures before opening circuit
  resetTimeout: 60 * 1000, // Time before attempting to close circuit (1 minute)
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

// Cache configuration
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds (reduced from 12 hours)
const ERROR_CACHE_TTL = 300 * 1000; // 5 minutes for error caching
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: { [key: string]: any } = {};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Cache refresh strategy: Refresh at specific times
const REFRESH_HOURS = [1, 7, 13, 19]; // 1AM, 7AM, 1PM, 7PM (check several times a day)

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
    setTimeout(
      () => {
        const nextRequest = RATE_LIMIT.requestQueue.shift();
        if (nextRequest) nextRequest();
      },
      RATE_LIMIT.timeWindow - (now - RATE_LIMIT.lastReset),
    );
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

  throw new Error("Circuit breaker is open - too many recent failures");
}

/**
 * Check if cache needs to be refreshed based on time
 */
function shouldRefreshCache(timestamp: number): boolean {
  const now = new Date();
  const lastCacheDate = new Date(timestamp);

  // If cache is older than maximum TTL, refresh it
  if (now.getTime() - timestamp >= CACHE_TTL) return true;

  // Check if we've passed any of our refresh hours since the last cache
  const currentHour = now.getHours();
  const lastCacheHour = lastCacheDate.getHours();

  // If it's a different day, refresh
  if (
    now.getDate() !== lastCacheDate.getDate() ||
    now.getMonth() !== lastCacheDate.getMonth() ||
    now.getFullYear() !== lastCacheDate.getFullYear()
  ) {
    return true;
  }

  // Check if we've passed any of our refresh checkpoints
  for (const hour of REFRESH_HOURS) {
    if (lastCacheHour < hour && currentHour >= hour) {
      return true;
    }
  }

  return false;
}

/**
 * Creates standard request options for BCRA API
 */
export function createBCRARequestOptions(path: string): RequestOptions {
  return {
    hostname: "api.bcra.gob.ar",
    path,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      Connection: "keep-alive",
      Origin: `https://${process.env.VERCEL_URL}`,
      Referer: `https://${process.env.VERCEL_URL}`,
      Host: "api.bcra.gob.ar",
      "Content-Language": "es-AR",
      "X-Forwarded-For": "190.191.237.1", // Common Argentina IP
      "CF-IPCountry": "AR", // Cloudflare country header
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    },
    timeout: 10000,
    rejectUnauthorized: false,
  };
}

export async function makeBCRADataRequest(
  options: RequestOptions,
  errorMessage: string,
  retryCount = 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Generate cache key from options
  const cacheKey = `BCRA_data_${options.hostname}_${options.path}`;

  // Check cache
  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        console.log(`Using cached error for ${options.path}`);
        throw new Error(cache[cacheKey].error.message);
      }
    } else if (!shouldRefreshCache(cache[cacheKey].timestamp)) {
      console.log(`Using cached data for ${options.path}`);
      return cache[cacheKey].data;
    }
  }

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

          // Cache the error
          cache[cacheKey] = {
            timestamp: Date.now(),
            error,
          };

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

            // Cache the successful response
            cache[cacheKey] = {
              timestamp: Date.now(),
              data: jsonData,
            };

            resolve(jsonData);
          } catch (error) {
            console.error("Error parsing JSON:", error);

            // Cache the error
            cache[cacheKey] = {
              timestamp: Date.now(),
              error: new Error(errorMessage),
            };

            reject(new Error(errorMessage));
          }
        });

        res.on("error", (error) => {
          console.error("Response error:", error);

          // Cache the error
          cache[cacheKey] = {
            timestamp: Date.now(),
            error: new Error(errorMessage),
          };

          reject(new Error(errorMessage));
        });
      });

      req.on("error", (error) => {
        console.error("Request error:", error);

        // Cache the error
        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error(errorMessage),
        };

        reject(new Error(errorMessage));
      });

      req.on("timeout", () => {
        console.error("Request timed out");
        req.destroy();

        // Cache the error
        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error(errorMessage),
        };

        reject(new Error(errorMessage));
      });

      // Set a reasonable timeout
      req.setTimeout(15000);
    });
  } catch (error) {
    // Handle retries
    if (retryCount < MAX_RETRIES) {
      console.log(
        `Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (retryCount + 1)),
      );
      return makeBCRADataRequest(options, errorMessage, retryCount + 1);
    }

    // Update circuit breaker
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
      CIRCUIT_BREAKER.isOpen = true;
    }

    // Cache the error
    cache[cacheKey] = {
      timestamp: Date.now(),
      error,
    };

    throw error;
  }
}

/**
 * For API routes: Makes a request to BCRA API and returns a Response object
 */
export async function makeBCRARequest(path: string): Promise<Response> {
  const cacheKey = `BCRA_route_${path}`;

  // Check cache
  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        console.log(`Using cached error for ${path}`);
        return NextResponse.json(
          { error: cache[cacheKey].error.message },
          { status: 500 },
        );
      }
    } else if (!shouldRefreshCache(cache[cacheKey].timestamp)) {
      console.log(`Using cached data for ${path}`);

      // Calculate time left until next refresh
      const cacheAge = Math.floor(
        (Date.now() - cache[cacheKey].timestamp) / 1000,
      );
      const maxAge = Math.floor(CACHE_TTL / 1000) - cacheAge;

      return NextResponse.json(cache[cacheKey].data, {
        status: 200,
        headers: {
          "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
          "Last-Modified": new Date(cache[cacheKey].timestamp).toUTCString(),
        },
      });
    }
  }

  return new Promise<Response>((resolve) => {
    const requestOptions = createBCRARequestOptions(path);

    // Use https.get with the configured options
    const req = https.get(requestOptions, (res) => {
      // Handle unauthorized errors
      if (res.statusCode === 401) {
        console.error("UNAUTHORIZED: BCRA API returned 401");
        const response = NextResponse.json(
          {
            error: "BCRA API unauthorized access",
            details:
              "The BCRA API rejected our request with a 401 status. This could be due to geolocation or IP restrictions.",
            headers: res.headers,
          },
          { status: 401 },
        );

        // Cache the error
        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error("BCRA API unauthorized access"),
        };

        resolve(response);
        return;
      }

      // Handle not found errors
      if (res.statusCode === 404) {
        console.error("NOT FOUND: BCRA API returned 404");
        const response = NextResponse.json(
          {
            error: "BCRA API resource not found",
            details: "The requested resource was not found in the BCRA API.",
            headers: res.headers,
          },
          { status: 404 },
        );

        // Cache the error
        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error("BCRA API resource not found"),
        };

        resolve(response);
        return;
      }

      let data = "";

      // Collect data chunks
      res.on("data", (chunk) => {
        data += chunk;
      });

      // Process complete response
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);

          // Cache the successful response
          cache[cacheKey] = {
            timestamp: Date.now(),
            data: jsonData,
          };

          // Set cache headers for browsers and CDNs
          const maxAge = Math.floor(CACHE_TTL / 1000);

          resolve(
            NextResponse.json(jsonData, {
              status: 200,
              headers: {
                "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
                "Last-Modified": new Date().toUTCString(),
              },
            }),
          );
        } catch (error) {
          console.error("Error parsing JSON:", error);
          console.error("First 100 chars of data:", data.substring(0, 100));

          // Cache the error
          cache[cacheKey] = {
            timestamp: Date.now(),
            error: new Error("Failed to parse BCRA data"),
          };

          resolve(
            NextResponse.json(
              {
                error: "Failed to parse BCRA data",
                details: error instanceof Error ? error.message : String(error),
                rawData: data.substring(0, 500), // First 500 chars to avoid huge responses
              },
              { status: 500 },
            ),
          );
        }
      });

      // Handle response errors
      res.on("error", (error) => {
        console.error("Response error:", error);

        // Cache the error
        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error("Error in BCRA API response"),
        };

        resolve(
          NextResponse.json(
            {
              error: "Error in BCRA API response",
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          ),
        );
      });
    });

    // Handle request errors
    req.on("error", (error) => {
      console.error("Request error:", error);

      // Cache the error
      cache[cacheKey] = {
        timestamp: Date.now(),
        error: new Error("Failed to fetch BCRA data"),
      };

      resolve(
        NextResponse.json(
          {
            error: "Failed to fetch BCRA data",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        ),
      );
    });

    // Handle request timeout
    req.on("timeout", () => {
      console.error("Request timed out");
      req.destroy();

      // Cache the error
      cache[cacheKey] = {
        timestamp: Date.now(),
        error: new Error("BCRA API request timed out"),
      };

      resolve(
        NextResponse.json(
          {
            error: "BCRA API request timed out",
            details: "Request took too long to complete",
          },
          { status: 504 },
        ),
      );
    });
  });
}
