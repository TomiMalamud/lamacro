// lib/direct-bcra.ts

import https, { RequestOptions } from 'https';
import { BCRAResponse } from './bcra-api';

// Add caching constants at the top of the file
const CACHE_TTL = 43200 * 1000; // 12 hours in milliseconds
const cache: { [key: string]: { timestamp: number; data: BCRAResponse } } = {};

/**
 * Added helper function to DRY out the https.get logic
 */
async function makeBCRARequest(options: RequestOptions, errorMessage: string): Promise<BCRAResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(options, (res) => {
      // Log status if needed (optional logging retained from original code)
      console.log(`STATUS: ${res.statusCode}`);
      if (res.statusCode === 401) {
        console.error('UNAUTHORIZED: BCRA API returned 401');
        return reject(new Error('BCRA API unauthorized access (401)'));
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Response ended - data length:', data.length);
        try {
          const jsonData = JSON.parse(data);
          console.log('Successfully parsed JSON data');
          resolve(jsonData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          reject(new Error(errorMessage));
        }
      });
      res.on('error', (error) => {
        console.error('Response error:', error);
        reject(new Error(errorMessage));
      });
    });
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(new Error(errorMessage));
    });
    req.on('timeout', () => {
      console.error('Request timed out');
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
  const cacheKey = 'BCRADirect';
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    console.log('Returning cached data for fetchBCRADirect');
    return cache[cacheKey].data;
  }

  console.log('Direct BCRA API call starting');
  const origin = 'https://bcraenvivo.vercel.app';
  const options: RequestOptions = {
    hostname: 'api.bcra.gob.ar',
    path: '/estadisticas/v3.0/monetarias',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Origin': origin,
      'Referer': origin,
      'Host': 'api.bcra.gob.ar',
      'Content-Language': 'es-AR',
      'X-Forwarded-For': '190.191.237.1',
      'CF-IPCountry': 'AR',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    },
    timeout: 15000,
    rejectUnauthorized: false
  };

  console.log('Sending direct request to BCRA API');
  const data = await makeBCRARequest(options, 'Failed to parse BCRA data');
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
  const cacheKey = `BCRA_ts_${variableId}_${desde || ''}_${hasta || ''}_${offset}_${limit}`;
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    console.log(`Returning cached data for fetchVariableTimeSeries with key: ${cacheKey}`);
    return cache[cacheKey].data;
  }

  console.log(`Fetching time series for variable ID: ${variableId}`);
  const origin = 'https://bcraenvivo.vercel.app';
  const queryParams = [];
  if (desde) queryParams.push(`desde=${desde}`);
  if (hasta) queryParams.push(`hasta=${hasta}`);
  if (offset > 0) queryParams.push(`offset=${offset}`);
  if (limit !== 1000) queryParams.push(`limit=${limit}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  const options: RequestOptions = {
    hostname: 'api.bcra.gob.ar',
    path: `/estadisticas/v3.0/monetarias/${variableId}${queryString}`,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Origin': origin,
      'Referer': origin,
      'Host': 'api.bcra.gob.ar',
      'Content-Language': 'es-AR',
      'X-Forwarded-For': '190.191.237.1',
      'CF-IPCountry': 'AR',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    },
    timeout: 15000,
    rejectUnauthorized: false
  };

  console.log(`Sending direct request to BCRA API for variable ${variableId} with params: ${queryString}`);
  const data = await makeBCRARequest(options, 'Failed to parse BCRA time series data');
  cache[cacheKey] = { timestamp: Date.now(), data };
  return data;
}