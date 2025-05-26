import { createBCRARequestOptions } from "@/lib/bcra-api-helper";
import { NextResponse } from "next/server";
import https from "https";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = (await params).id;
  const path = `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${id}`;

  try {
    const requestOptions = createBCRARequestOptions(path);

    return new Promise<Response>((resolve) => {
      const req = https.get(requestOptions, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          // For cheques endpoint, treat any error status as "no data found"
          if (res.statusCode !== 200) {
            console.log(
              `BCRA cheques API returned ${res.statusCode} for ID ${id} - treating as no data`,
            );
            resolve(
              NextResponse.json(
                {
                  results: {
                    denominacion: null,
                    cheques: [],
                  },
                },
                { status: 200 },
              ),
            );
            return;
          }

          try {
            const jsonData = JSON.parse(data);
            resolve(NextResponse.json(jsonData, { status: 200 }));
          } catch (error) {
            console.error("Error parsing cheques JSON:", error);
            // Even JSON parsing errors should be treated as "no data"
            resolve(
              NextResponse.json(
                {
                  results: {
                    denominacion: null,
                    cheques: [],
                  },
                },
                { status: 200 },
              ),
            );
          }
        });

        res.on("error", (error) => {
          console.error("Response error for cheques:", error);
          resolve(
            NextResponse.json(
              {
                results: {
                  denominacion: null,
                  cheques: [],
                },
              },
              { status: 200 },
            ),
          );
        });
      });

      req.on("error", (error) => {
        console.error("Request error for cheques:", error);
        resolve(
          NextResponse.json(
            {
              results: {
                denominacion: null,
                cheques: [],
              },
            },
            { status: 200 },
          ),
        );
      });

      req.on("timeout", () => {
        console.error("Request timed out for cheques");
        req.destroy();
        resolve(
          NextResponse.json(
            {
              results: {
                denominacion: null,
                cheques: [],
              },
            },
            { status: 200 },
          ),
        );
      });
    });
  } catch (error) {
    console.error("Unexpected error in cheques endpoint:", error);
    return NextResponse.json(
      {
        results: {
          denominacion: null,
          cheques: [],
        },
      },
      { status: 200 },
    );
  }
}
