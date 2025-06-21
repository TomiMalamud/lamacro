import { NextRequest, NextResponse } from "next/server";
import {
  createBCRARequestOptions,
  makeBCRADataRequest,
} from "@/lib/bcra-api-helper";
import { setRedisCache } from "@/lib/redis-cache";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized cron job access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("Starting BCRA cache refresh cron job");

    const options = createBCRARequestOptions("/estadisticas/v3.0/monetarias");
    const data = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA data in cron job",
    );

    if (!data || !data.results) {
      throw new Error("Invalid data structure received from BCRA API");
    }

    await setRedisCache("bcra:BCRADirect", data);

    const duration = Date.now() - startTime;
    console.log(`BCRA cache refresh completed successfully in ${duration}ms`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recordsCount: data.results.length,
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
