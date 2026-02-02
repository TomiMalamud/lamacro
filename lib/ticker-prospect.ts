import { cache } from "react";
import { TICKER_PROSPECT, type TickerProspectEntry } from "./constants";

const TICKER_SHEET_ID = "1MxsnnAW9yErCX2ZvuwgM-FtHWJMivA4ZTYEZt-P7nPs";
const TICKER_SHEET_GID = "1058333006";
const TICKER_SHEET_URL = `https://docs.google.com/spreadsheets/d/${TICKER_SHEET_ID}/export?format=csv&gid=${TICKER_SHEET_GID}`;
const SHEET_REVALIDATE_SECONDS = 3600;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      row.push(value);
      value = "";

      if (char === ",") {
        continue;
      }

      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseDateAr(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return null;

  const parts = cleaned.split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseTickerProspectCsv(csv: string): TickerProspectEntry[] {
  const rows = parseCsv(csv);
  if (rows.length === 0) return [];

  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === "ticker"),
  );
  const headerRow = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0];
  const headers = headerRow.map(normalizeHeader);

  const tickerIndex = headers.findIndex((header) => header === "ticker");
  const fechaIndex = headers.findIndex((header) =>
    header.startsWith("fechavenc"),
  );
  const pagoIndex = headers.findIndex((header) => header === "pago");

  if (tickerIndex < 0 || fechaIndex < 0 || pagoIndex < 0) {
    return [];
  }

  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;

  return rows
    .slice(startIndex)
    .map((row) => {
      const tickerRaw = row[tickerIndex]?.trim();
      if (!tickerRaw) return null;

      const fechaRaw = row[fechaIndex] ?? "";
      const pagoRaw = row[pagoIndex] ?? "";

      const fechaVencimiento = parseDateAr(fechaRaw);
      const pagoFinal = parseNumber(pagoRaw);

      if (!fechaVencimiento || pagoFinal === null) return null;

      return {
        ticker: tickerRaw.toUpperCase(),
        fechaVencimiento,
        pagoFinal,
      } satisfies TickerProspectEntry;
    })
    .filter((entry): entry is TickerProspectEntry => Boolean(entry));
}

export function mergeTickerProspects(
  base: TickerProspectEntry[],
  remote: TickerProspectEntry[],
): TickerProspectEntry[] {
  const remoteByTicker = new Map(
    remote.map((entry) => [entry.ticker, entry] as const),
  );

  const merged = base.map((entry) => remoteByTicker.get(entry.ticker) ?? entry);
  const baseTickers = new Set(base.map((entry) => entry.ticker));

  const extras = remote
    .filter((entry) => !baseTickers.has(entry.ticker))
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  return [...merged, ...extras];
}

async function fetchTickerProspectCsv(): Promise<string> {
  const response = await fetch(TICKER_SHEET_URL, {
    next: { revalidate: SHEET_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Ticker sheet request failed: ${response.status}`);
  }

  return response.text();
}

export async function fetchTickerProspectFromSheet(): Promise<
  TickerProspectEntry[]
> {
  const csv = await fetchTickerProspectCsv();
  return parseTickerProspectCsv(csv);
}

export async function getHydratedTickerProspectUncached(): Promise<
  TickerProspectEntry[]
> {
  const base = TICKER_PROSPECT;

  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "test" &&
    process.env.ALLOW_TICKER_SHEET_FETCH !== "true"
  ) {
    return base;
  }

  try {
    const remote = await fetchTickerProspectFromSheet();
    if (remote.length === 0) {
      return base;
    }
    return mergeTickerProspects(base, remote);
  } catch (error) {
    console.warn("Ticker sheet unavailable, falling back to constants.", error);
    return base;
  }
}

export const getHydratedTickerProspect = cache(
  getHydratedTickerProspectUncached,
);
