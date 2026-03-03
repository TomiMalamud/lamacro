import {
  createBCRARequestOptions,
  makeBCRADataRequest,
} from "./bcra-api-helper";

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

export type BCRAData = {
  loading: boolean;
  error: string | null;
  data: BCRAVariable[];
};

interface V4MainVariable {
  idVariable: number;
  descripcion?: string;
  categoria?: string;
  ultFechaInformada: string;
  ultValorInformado: number;
}

interface V4DetailEntry {
  fecha: string;
  valor: number;
}

interface V4TimeSeriesVariable {
  idVariable: number;
  descripcion?: string;
  categoria?: string;
  detalle?: V4DetailEntry[];
}

export const VARIABLE_GROUPS = {
  KEY_METRICS: [1, 4, 5, 6, 15, 27, 28, 29],
  INTEREST_RATES: [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 34, 35, 40, 41, 160, 161, 162,
  ],
  EXCHANGE_RATES: [4, 5, 84],
  INFLATION: [27, 28, 29, 30, 31, 32],
  RESERVES: [1, 74, 75, 76, 77],
  MONETARY_BASE: [15, 16, 17, 18, 19, 46, 64, 71, 72, 73],
};

interface CacheEntry {
  timestamp: number;
  data: BCRAResponse;
  error?: Error;
}

const CACHE_TTL = 43200 * 1000;
const ERROR_CACHE_TTL = 300 * 1000;
const cache: { [key: string]: CacheEntry } = {};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResponseStatus(data: unknown): number {
  if (!isObjectRecord(data)) return 500;
  return typeof data.status === "number" ? data.status : 500;
}

function getResponseResults(data: unknown): unknown[] {
  if (!isObjectRecord(data) || !Array.isArray(data.results)) return [];
  return data.results;
}

function isLegacyVariable(item: unknown): item is BCRAVariable {
  if (!isObjectRecord(item)) return false;
  return (
    typeof item.idVariable === "number" &&
    typeof item.descripcion === "string" &&
    typeof item.categoria === "string" &&
    typeof item.fecha === "string" &&
    typeof item.valor === "number"
  );
}

function isV4MainVariable(item: unknown): item is V4MainVariable {
  if (!isObjectRecord(item)) return false;
  return (
    typeof item.idVariable === "number" &&
    typeof item.ultFechaInformada === "string" &&
    typeof item.ultValorInformado === "number"
  );
}

function isV4TimeSeriesVariable(item: unknown): item is V4TimeSeriesVariable {
  if (!isObjectRecord(item)) return false;
  return typeof item.idVariable === "number" && Array.isArray(item.detalle);
}

function normalizeDirectResponse(data: unknown): BCRAResponse {
  const results = getResponseResults(data)
    .map((item): BCRAVariable | null => {
      if (isLegacyVariable(item)) return item;

      if (isV4MainVariable(item)) {
        return {
          idVariable: item.idVariable,
          descripcion: item.descripcion ?? `Variable #${item.idVariable}`,
          categoria: item.categoria ?? "Sin categoría",
          fecha: item.ultFechaInformada,
          valor: item.ultValorInformado,
        };
      }

      return null;
    })
    .filter((item): item is BCRAVariable => item !== null);

  return {
    status: getResponseStatus(data),
    results,
  };
}

function normalizeTimeSeriesResponse(data: unknown): BCRAResponse {
  const results = getResponseResults(data).flatMap((item): BCRAVariable[] => {
    if (isLegacyVariable(item)) return [item];

    if (isV4TimeSeriesVariable(item)) {
      return (
        item.detalle
          ?.filter(
            (entry): entry is V4DetailEntry =>
              isObjectRecord(entry) &&
              typeof entry.fecha === "string" &&
              typeof entry.valor === "number",
          )
          .map((entry) => ({
            idVariable: item.idVariable,
            descripcion: item.descripcion ?? `Variable #${item.idVariable}`,
            categoria: item.categoria ?? "Sin categoría",
            fecha: entry.fecha,
            valor: entry.valor,
          })) ?? []
      );
    }

    return [];
  });

  return {
    status: getResponseStatus(data),
    results,
  };
}

function validateParams(
  variableId?: number,
  desde?: string,
  hasta?: string,
  offset?: number,
  limit?: number,
): void {
  if (variableId && (!Number.isInteger(variableId) || variableId <= 0)) {
    throw new Error("Invalid variable ID");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (desde && !dateRegex.test(desde))
    throw new Error("Invalid desde date format");
  if (hasta && !dateRegex.test(hasta))
    throw new Error("Invalid hasta date format");

  if (offset && (!Number.isInteger(offset) || offset < 0))
    throw new Error("Invalid offset");
  if (limit && (!Number.isInteger(limit) || limit <= 0 || limit > 3000))
    throw new Error("Invalid limit");
}

export async function fetchBCRADirect(): Promise<BCRAResponse> {
  const cacheKey = "BCRADirect";

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const options = createBCRARequestOptions("/estadisticas/v4.0/monetarias");

  try {
    const rawData = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA data",
    );
    const data = normalizeDirectResponse(rawData);
    cache[cacheKey] = { timestamp: Date.now(), data };

    return data;
  } catch (error) {
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error)),
    };
    throw error;
  }
}

export async function fetchVariableTimeSeries(
  variableId: number,
  desde?: string,
  hasta?: string,
  offset: number = 0,
  limit: number = 1000,
): Promise<BCRAResponse> {
  validateParams(variableId, desde, hasta, offset, limit);

  const cacheKey = `BCRA_ts_${variableId}_${desde || ""}_${
    hasta || ""
  }_${offset}_${limit}`;

  if (cache[cacheKey]) {
    if (cache[cacheKey].error) {
      if (Date.now() - cache[cacheKey].timestamp < ERROR_CACHE_TTL) {
        throw cache[cacheKey].error;
      }
    } else if (Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].data;
    }
  }

  const queryParams = [];
  if (desde) queryParams.push(`desde=${desde}`);
  if (hasta) queryParams.push(`hasta=${hasta}`);
  if (offset > 0) queryParams.push(`offset=${offset}`);
  if (limit !== 1000) queryParams.push(`limit=${limit}`);
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const options = createBCRARequestOptions(
    `/estadisticas/v4.0/monetarias/${variableId}${queryString}`,
  );

  try {
    const rawData = await makeBCRADataRequest(
      options,
      "Failed to parse BCRA time series data",
    );
    const data = normalizeTimeSeriesResponse(rawData);
    cache[cacheKey] = { timestamp: Date.now(), data };

    return data;
  } catch (error) {
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: { status: 500, results: [] },
      error: error instanceof Error ? error : new Error(String(error)),
    };
    throw error;
  }
}
