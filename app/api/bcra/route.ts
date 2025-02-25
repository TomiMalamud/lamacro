import { NextResponse } from 'next/server';
import https from 'https';

// Disable Next.js's defaults for API routes
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Handler for GET requests to this API route
 * Uses Node.js native https.get which we've verified works with the BCRA API
 */
export async function GET(): Promise<Response> {
  console.log('API route handler called - starting request to BCRA');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Vercel URL:', process.env.VERCEL_URL || 'not set');
  
  return new Promise<Response>((resolve) => {
    // Setup request options
    const options = {
      hostname: 'api.bcra.gob.ar',
      path: '/estadisticas/v3.0/monetarias',
      method: 'GET',
      headers: {
        'User-Agent': 'curl/7.79.1',
        'Accept': '*/*',
      },
      timeout: 15000, // 15 second timeout
      rejectUnauthorized: false, // Disable SSL validation
    };
    
    console.log('Sending request to BCRA API with options:', JSON.stringify(options));
    
    // Use https.get with the configured options
    const req = https.get(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      
      // Collect data chunks
      res.on('data', (chunk) => {
        data += chunk;
        console.log(`Received data chunk (${chunk.length} bytes)`);
      });
      
      // Process complete response
      res.on('end', () => {
        console.log('Response ended - total data length:', data.length);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('Successfully parsed JSON data');
          
          resolve(NextResponse.json(jsonData, {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            }
          }));
        } catch (error) {
          console.error('Error parsing JSON:', error);
          console.error('First 100 chars of data:', data.substring(0, 100));
          
          resolve(NextResponse.json(
            { 
              error: 'Failed to parse BCRA data', 
              details: error instanceof Error ? error.message : String(error),
              rawData: data.substring(0, 500) // First 500 chars to avoid huge responses
            },
            { status: 500 }
          ));
        }
      });
      
      // Handle response errors
      res.on('error', (error) => {
        console.error('Response error:', error);
        
        resolve(NextResponse.json(
          { 
            error: 'Error in BCRA API response', 
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        ));
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error('Request error:', error);
      
      resolve(NextResponse.json(
        { 
          error: 'Failed to fetch BCRA data', 
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      ));
    });
    
    // Handle request timeout
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      
      resolve(NextResponse.json(
        { 
          error: 'BCRA API request timed out', 
          details: 'Request took too long to complete'
        },
        { status: 504 }
      ));
    });
    
    console.log('Request sent to BCRA API');
  });
} 