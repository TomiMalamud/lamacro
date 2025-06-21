import { NextRequest, NextResponse } from "next/server";
import {
  createBCRARequestOptions,
  makeBCRADataRequest,
} from "@/lib/bcra-api-helper";
import { STATIC_VARIABLE_IDS } from "@/lib/constants";
import { setRedisCache } from "@/lib/redis-cache";
import { format, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized cron job access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("Starting BCRA cache refresh cron job");

    // Cache main BCRA data
    const options = createBCRARequestOptions("/estadisticas/v3.0/monetarias");
    const data = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA data in cron job",
    );

    if (!data || !data.results) {
      throw new Error("Invalid data structure received from BCRA API");
    }

    await setRedisCache("bcra:BCRADirect", data);
    console.log("Main BCRA data cached successfully");

    // Cache individual variable details
    const desde = format(subMonths(new Date(), 3), "yyyy-MM-dd");
    const hasta = format(new Date(), "yyyy-MM-dd");
    let cachedVariables = 0;
    let failedVariables = 0;

    console.log(
      `Starting to cache ${STATIC_VARIABLE_IDS.length} variable details`,
    );

    // Process variables in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    for (let i = 0; i < STATIC_VARIABLE_IDS.length; i += BATCH_SIZE) {
      const batch = STATIC_VARIABLE_IDS.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (variableId) => {
          try {
            const queryParams = [];
            if (desde) queryParams.push(`desde=${desde}`);
            if (hasta) queryParams.push(`hasta=${hasta}`);
            queryParams.push(`limit=1000`);
            const queryString =
              queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

            const variableOptions = createBCRARequestOptions(
              `/estadisticas/v3.0/monetarias/${variableId}${queryString}`,
            );

            const variableData = await makeBCRADataRequest(
              variableOptions,
              `Failed to parse variable ${variableId} data in cron job`,
            );

            if (
              variableData &&
              variableData.results &&
              variableData.results.length > 0
            ) {
              await setRedisCache(`bcra:details_${variableId}`, variableData);
              cachedVariables++;
              console.log(`Variable ${variableId} cached successfully`);
            } else {
              console.warn(`Variable ${variableId} returned empty results`);
              failedVariables++;
            }
          } catch (error) {
            console.error(
              `Failed to cache variable ${variableId}:`,
              error instanceof Error ? error.message : String(error),
            );
            failedVariables++;
          }
        }),
      );

      // Add a small delay between batches to be respectful to the API
      if (i + BATCH_SIZE < STATIC_VARIABLE_IDS.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`BCRA cache refresh completed successfully in ${duration}ms`);
    console.log(
      `Successfully cached: ${cachedVariables} variables, Failed: ${failedVariables} variables`,
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recordsCount: data.results.length,
      cachedVariables,
      failedVariables,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("BCRA cache refresh failed:", {
      error: errorMessage,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Cache refresh failed",
        details: errorMessage,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 },
    );
  }
}
