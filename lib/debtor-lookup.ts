import "server-only";

import type {
  ChequeResponse,
  DeudaResponse,
  HistorialResponse,
} from "@/lib/debts";
import { fetchCheques, fetchDeudas, fetchHistorial } from "@/lib/debts";
import { cache } from "react";

const CACHE_TTL_MS = 60 * 60 * 1000;
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type BCRADataSource = "deudas" | "historial" | "cheques";

type LookupResult<T> = {
  data: T | null;
  unavailable: boolean;
};

type SourceCacheEntry<T> = {
  timestamp: number;
  data: T | null;
};

export type DebtorLookupResponse = {
  deudaData: DeudaResponse | null;
  historialData: HistorialResponse | null;
  chequesData: ChequeResponse | null;
  unavailable: Record<BCRADataSource, boolean>;
};

const deudaCache = new Map<string, SourceCacheEntry<DeudaResponse>>();
const historialCache = new Map<string, SourceCacheEntry<HistorialResponse>>();
const chequesCache = new Map<string, SourceCacheEntry<ChequeResponse>>();

async function lookupBCRAData<T>(
  source: BCRADataSource,
  fetchData: () => Promise<T | null>,
): Promise<LookupResult<T>> {
  try {
    return {
      data: await fetchData(),
      unavailable: false,
    };
  } catch (error) {
    console.warn(`BCRA ${source} lookup failed`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      data: null,
      unavailable: true,
    };
  }
}

function getCachedSource<T>(
  cacheStore: Map<string, SourceCacheEntry<T>>,
  id: string,
  maxAgeMs: number,
): T | null | undefined {
  const cached = cacheStore.get(id);
  if (!cached) return undefined;
  if (Date.now() - cached.timestamp > maxAgeMs) return undefined;

  return cached.data;
}

function cacheSource<T>(
  cacheStore: Map<string, SourceCacheEntry<T>>,
  id: string,
  data: T | null,
): void {
  cacheStore.set(id, {
    timestamp: Date.now(),
    data,
  });
}

async function lookupCachedSource<T>(
  source: BCRADataSource,
  cacheStore: Map<string, SourceCacheEntry<T>>,
  id: string,
  fetchData: () => Promise<T | null>,
): Promise<LookupResult<T>> {
  const cachedData = getCachedSource(cacheStore, id, CACHE_TTL_MS);
  if (cachedData !== undefined) {
    return {
      data: cachedData,
      unavailable: false,
    };
  }

  const result = await lookupBCRAData(source, fetchData);

  if (result.unavailable) {
    const staleData = getCachedSource(cacheStore, id, STALE_CACHE_TTL_MS);
    if (staleData !== undefined) {
      return {
        data: staleData,
        unavailable: true,
      };
    }

    return {
      data: null,
      unavailable: true,
    };
  }

  cacheSource(cacheStore, id, result.data);
  return result;
}

export const getDebtorDeudas = cache(async (id: string) =>
  lookupCachedSource("deudas", deudaCache, id, () =>
    fetchDeudas(id, { logErrors: false }),
  ),
);

export const getDebtorHistorial = cache(async (id: string) =>
  lookupCachedSource("historial", historialCache, id, () =>
    fetchHistorial(id, { logErrors: false }),
  ),
);

export const getDebtorCheques = cache(async (id: string) =>
  lookupCachedSource("cheques", chequesCache, id, () =>
    fetchCheques(id, { logErrors: false }),
  ),
);

export async function lookupDebtor(id: string): Promise<DebtorLookupResponse> {
  const deudaResult = await getDebtorDeudas(id);
  const [historialResult, chequesResult] = await Promise.all([
    getDebtorHistorial(id),
    getDebtorCheques(id),
  ]);

  return {
    deudaData: deudaResult.data,
    historialData: historialResult.data,
    chequesData: chequesResult.data,
    unavailable: {
      deudas: deudaResult.unavailable,
      historial: historialResult.unavailable,
      cheques: chequesResult.unavailable,
    },
  };
}

export function hasCriticalDebtorLookupUnavailableData(
  body: DebtorLookupResponse,
): boolean {
  const hasData = body.deudaData || body.historialData || body.chequesData;

  return (
    body.unavailable.deudas ||
    body.unavailable.historial ||
    (!hasData && body.unavailable.cheques)
  );
}
