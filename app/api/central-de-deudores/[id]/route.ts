import type {
  ChequeResponse,
  DeudaResponse,
  HistorialResponse,
} from "@/lib/debts";
import https from "https";
import { NextRequest, NextResponse } from "next/server";

const BCRA_HOST = "api.bcra.gob.ar";
const BCRA_RETRIES = 4;
const BCRA_RETRY_DELAY_MS = 700;
const BCRA_TIMEOUT_MS = 10000;

type BCRADataSource = "deudas" | "historial" | "cheques";

type LookupResult<T> = {
  data: T | null;
  unavailable: boolean;
};

export type DebtorLookupResponse = {
  deudaData: DeudaResponse | null;
  historialData: HistorialResponse | null;
  chequesData: ChequeResponse | null;
  unavailable: Record<BCRADataSource, boolean>;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBCRAJson<T>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt <= BCRA_RETRIES; attempt++) {
    try {
      return await fetchBCRAJsonOnce<T>(path);
    } catch (error) {
      if (attempt === BCRA_RETRIES) {
        throw error;
      }

      await wait(BCRA_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return null;
}

async function fetchBCRAJsonOnce<T>(path: string): Promise<T | null> {
  return new Promise<T | null>((resolve, reject) => {
    const request = https.request(
      {
        hostname: BCRA_HOST,
        servername: BCRA_HOST,
        path,
        method: "GET",
        family: 4,
        timeout: BCRA_TIMEOUT_MS,
        headers: {
          Host: BCRA_HOST,
          Connection: "close",
          "Content-Language": "es-AR",
          "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode === 404) {
            resolve(null);
            return;
          }

          if (
            !response.statusCode ||
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            reject(
              new Error(`BCRA returned ${response.statusCode ?? "unknown"}`),
            );
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy(new Error("BCRA request timed out"));
    });
    request.end();
  });
}

async function lookupBCRAData<T>(
  fetchData: () => Promise<T | null>,
): Promise<LookupResult<T>> {
  try {
    return {
      data: await fetchData(),
      unavailable: false,
    };
  } catch {
    return {
      data: null,
      unavailable: true,
    };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d{7,11}$/.test(id)) {
    return NextResponse.json({ error: "Invalid CUIT/CUIL" }, { status: 400 });
  }

  const deudaResult = await lookupBCRAData(() =>
    fetchBCRAJson<DeudaResponse>(`/centraldedeudores/v1.0/Deudas/${id}`),
  );
  const historialResult = await lookupBCRAData(() =>
    fetchBCRAJson<HistorialResponse>(
      `/centraldedeudores/v1.0/Deudas/Historicas/${id}`,
    ),
  );
  const chequesResult = await lookupBCRAData(() =>
    fetchBCRAJson<ChequeResponse>(
      `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${id}`,
    ),
  );

  const body: DebtorLookupResponse = {
    deudaData: deudaResult.data,
    historialData: historialResult.data,
    chequesData: chequesResult.data,
    unavailable: {
      deudas: deudaResult.unavailable,
      historial: historialResult.unavailable,
      cheques: chequesResult.unavailable,
    },
  };

  const status =
    body.unavailable.deudas && body.unavailable.historial ? 503 : 200;

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const preferredRegion = "gru1";
