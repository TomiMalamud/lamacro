import https, { RequestOptions } from "https";

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

// Add caching constants at the top of the file
const CACHE_TTL = 43200 * 1000; // 12 hours in milliseconds
const cache: { [key: string]: { timestamp: number; data: BCRAResponse } } = {};

/**
 * Added helper function to DRY out the https.get logic
 */
async function makeBCRARequest(
  options: RequestOptions,
  errorMessage: string
): Promise<BCRAResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(options, (res) => {
      if (res.statusCode === 401) {
        console.error("UNAUTHORIZED: BCRA API returned 401");
        return reject(new Error("BCRA API unauthorized access (401)"));
      }
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
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
  });
}

/**
 * Directly fetches data from BCRA API using Node.js native https
 * This bypasses the internal API route to avoid server component to API route issues
 */
export async function fetchBCRADirect(): Promise<BCRAResponse> {
  const cacheKey = "BCRADirect";
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
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

  const data = await makeBCRARequest(options, "Failed to parse BCRA data");
  cache[cacheKey] = { timestamp: Date.now(), data };
  return data;
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
  const cacheKey = `BCRA_ts_${variableId}_${desde || ""}_${
    hasta || ""
  }_${offset}_${limit}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
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

  const data = await makeBCRARequest(
    options,
    "Failed to parse BCRA time series data"
  );
  cache[cacheKey] = { timestamp: Date.now(), data };
  return data;
}
