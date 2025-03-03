import https from "https";
import { NextResponse } from "next/server";

// Disable Next.js's defaults for API routes
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Handler for GET requests to this API route
 * Uses Node.js native https.get which we've verified works with the BCRA API
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const id = (await params).id;
  return new Promise<Response>((resolve) => {
    // Normalize the origin for headers regardless of environment
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://bcra.tmalamud.com";

    // Setup request options with expanded headers to handle various auth scenarios
    const options = {
      hostname: "api.bcra.gob.ar",
      path: `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${id}`,
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
        "X-Forwarded-For": "190.191.237.1", // Common Argentina IP
        "CF-IPCountry": "AR", // Cloudflare country header
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
      },
      timeout: 15000, // 15 second timeout
      rejectUnauthorized: false // Disable SSL validation
    };

    // Use https.get with the configured options
    const req = https.get(options, (res) => {
      // Handle unauthorized errors
      if (res.statusCode === 401) {
        console.error("UNAUTHORIZED: BCRA API returned 401");
        resolve(
          NextResponse.json(
            {
              error: "BCRA API unauthorized access",
              details:
                "The BCRA API rejected our request with a 401 status. This could be due to geolocation or IP restrictions.",
              headers: res.headers
            },
            { status: 401 }
          )
        );
        return;
      }

      // Handle not found errors
      if (res.statusCode === 404) {
        console.error("NOT FOUND: BCRA API returned 404");
        resolve(
          NextResponse.json(
            {
              error: "BCRA API resource not found",
              details: "The requested resource was not found in the BCRA API.",
              headers: res.headers
            },
            { status: 404 }
          )
        );
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

          resolve(
            NextResponse.json(jsonData, {
              status: 200,
              headers: {
                "Cache-Control": "no-store, max-age=0"
              }
            })
          );
        } catch (error) {
          console.error("Error parsing JSON:", error);
          console.error("First 100 chars of data:", data.substring(0, 100));

          resolve(
            NextResponse.json(
              {
                error: "Failed to parse BCRA data",
                details: error instanceof Error ? error.message : String(error),
                rawData: data.substring(0, 500) // First 500 chars to avoid huge responses
              },
              { status: 500 }
            )
          );
        }
      });

      // Handle response errors
      res.on("error", (error) => {
        console.error("Response error:", error);

        resolve(
          NextResponse.json(
            {
              error: "Error in BCRA API response",
              details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
          )
        );
      });
    });

    // Handle request errors
    req.on("error", (error) => {
      console.error("Request error:", error);

      resolve(
        NextResponse.json(
          {
            error: "Failed to fetch BCRA data",
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        )
      );
    });

    // Handle request timeout
    req.on("timeout", () => {
      console.error("Request timed out");
      req.destroy();

      resolve(
        NextResponse.json(
          {
            error: "BCRA API request timed out",
            details: "Request took too long to complete"
          },
          { status: 504 }
        )
      );
    });
  });
}
