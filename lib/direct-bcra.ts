// Create a new file: lib/direct-bcra.ts

import https from 'https';
import { BCRAResponse } from './bcra-api';

/**
 * Directly fetches data from BCRA API using Node.js native https
 * This bypasses the internal API route to avoid server component to API route issues
 */
export async function fetchBCRADirect(): Promise<BCRAResponse> {
  console.log('Direct BCRA API call starting');
  
  return new Promise<BCRAResponse>((resolve, reject) => {
    // Setup origin for headers
    const origin = 'https://bcraenvivo.vercel.app';
    
    // Using the same options from your route.ts file
    const options = {
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
        'X-Forwarded-For': '190.191.237.1', // Common Argentina IP 
        'CF-IPCountry': 'AR', // Cloudflare country header
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 15000, // 15 second timeout
      rejectUnauthorized: false, // Disable SSL validation
    };
    
    console.log('Sending direct request to BCRA API');
    
    // Use https.get with the configured options
    const req = https.get(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      
      // Handle unauthorized errors
      if (res.statusCode === 401) {
        console.error('UNAUTHORIZED: BCRA API returned 401');
        reject(new Error('BCRA API unauthorized access (401)'));
        return;
      }
      
      let data = '';
      
      // Collect data chunks
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process complete response
      res.on('end', () => {
        console.log('Response ended - data length:', data.length);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('Successfully parsed JSON data');
          
          resolve(jsonData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          reject(new Error('Failed to parse BCRA data'));
        }
      });
      
      // Handle response errors
      res.on('error', (error) => {
        console.error('Response error:', error);
        reject(new Error('Error in BCRA API response'));
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(new Error('Failed to fetch BCRA data'));
    });
    
    // Handle request timeout
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      reject(new Error('BCRA API request timed out'));
    });
  });
}