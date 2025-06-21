import https, { RequestOptions } from "https";
import { NextResponse } from "next/server";
const RATE_LIMIT = {
  maxRequests: 60,
  timeWindow: 60 * 1000,
  requestQueue: [] as (() => void)[],
  requestCount: 0,
  lastReset: Date.now(),
};

const CIRCUIT_BREAKER = {
  failureThreshold: 5,
  resetTimeout: 60 * 1000,
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

const CACHE_TTL = 3600 * 1000;
const ERROR_CACHE_TTL = 300 * 1000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: { [key: string]: any } = {};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const SIMULATE_API_DOWN = false;

const REFRESH_HOURS = [1, 7, 13, 19];

function checkRateLimit(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();

    if (now - RATE_LIMIT.lastReset >= RATE_LIMIT.timeWindow) {
      RATE_LIMIT.requestCount = 0;
      RATE_LIMIT.lastReset = now;
    }

    if (RATE_LIMIT.requestCount < RATE_LIMIT.maxRequests) {
      RATE_LIMIT.requestCount++;
      resolve();
      return;
    }

    RATE_LIMIT.requestQueue.push(() => {
      RATE_LIMIT.requestCount++;
      resolve();
    });

    setTimeout(
      () => {
        const nextRequest = RATE_LIMIT.requestQueue.shift();
        if (nextRequest) nextRequest();
      },
      RATE_LIMIT.timeWindow - (now - RATE_LIMIT.lastReset),
    );
  });
}

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

function shouldRefreshCache(timestamp: number): boolean {
  const now = new Date();
  const lastCacheDate = new Date(timestamp);

  if (now.getTime() - timestamp >= CACHE_TTL) return true;

  const currentHour = now.getHours();
  const lastCacheHour = lastCacheDate.getHours();

  if (
    now.getDate() !== lastCacheDate.getDate() ||
    now.getMonth() !== lastCacheDate.getMonth() ||
    now.getFullYear() !== lastCacheDate.getFullYear()
  ) {
    return true;
  }

  for (const hour of REFRESH_HOURS) {
    if (lastCacheHour < hour && currentHour >= hour) {
      return true;
    }
  }

  return false;
}

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
  const cacheKey = `BCRA_data_${options.hostname}_${options.path}`;

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw new Error(cache[cacheKey].error.message);
      }
    } else if (!shouldRefreshCache(cache[cacheKey].timestamp)) {
      return cache[cacheKey].data;
    }
  }

  try {
    if (SIMULATE_API_DOWN) {
      throw new Error("Simulated BCRA API failure - API appears to be down");
    }

    checkCircuitBreaker();

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
            CIRCUIT_BREAKER.failures = 0;

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
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (retryCount + 1)),
      );
      return makeBCRADataRequest(options, errorMessage, retryCount + 1);
    }

    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
      CIRCUIT_BREAKER.isOpen = true;
    }

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

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        return NextResponse.json(
          { error: cache[cacheKey].error.message },
          { status: 500 },
        );
      }
    } else if (!shouldRefreshCache(cache[cacheKey].timestamp)) {
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

    const req = https.get(requestOptions, (res) => {
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

        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error("BCRA API unauthorized access"),
        };

        resolve(response);
        return;
      }

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

        cache[cacheKey] = {
          timestamp: Date.now(),
          error: new Error("BCRA API resource not found"),
        };

        resolve(response);
        return;
      }

      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);

          cache[cacheKey] = {
            timestamp: Date.now(),
            data: jsonData,
          };

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

          cache[cacheKey] = {
            timestamp: Date.now(),
            error: new Error("Failed to parse BCRA data"),
          };

          resolve(
            NextResponse.json(
              {
                error: "Failed to parse BCRA data",
                details: error instanceof Error ? error.message : String(error),
                rawData: data.substring(0, 500),
              },
              { status: 500 },
            ),
          );
        }
      });

      res.on("error", (error) => {
        console.error("Response error:", error);

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

    req.on("error", (error) => {
      console.error("Request error:", error);

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

    req.on("timeout", () => {
      console.error("Request timed out");
      req.destroy();

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
