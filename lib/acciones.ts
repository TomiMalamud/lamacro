import { fetchVariableTimeSeries } from "./bcra-fetch";

interface RawAccionData {
  symbol: string;
  q_bid: number;
  px_bid: number;
  px_ask: number;
  q_ask: number;
  v: number;
  q_op: number;
  c: number;
  pct_change: number;
}

type AccionWithYTD = RawAccionData & {
  name: string;
  ytdReturn: number;
};

type AccionWithoutYTD = RawAccionData & {
  name: null;
  ytdReturn: null;
};

export async function calculateAccumulatedInflation(): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetchVariableTimeSeries(27, "2025-01-01", today);

    if (!response.results || response.results.length === 0) {
      return 0;
    }

    let accumulatedInflation = 1;
    response.results.forEach((item) => {
      const monthlyRate = item.valor / 100;
      accumulatedInflation *= 1 + monthlyRate;
    });
    return Number(((accumulatedInflation - 1) * 100).toFixed(1));
  } catch (error) {
    console.error("Error fetching inflation data:", error);
    return 0;
  }
}

export async function getAcciones() {
  try {
    const response = await fetch("https://data912.com/live/arg_stocks", {
      next: { revalidate: 1200 },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching acciones:", error);
    return [];
  }
}

export async function getAccionesWithYTD() {
  const rawData = await getAcciones();
  return calculateYTDReturns(rawData);
}

export const panelLiderYTDBaseline = [
  { symbol: "ALUA", name: "Aluar Aluminio Argentino SAIC", value: 894 },
  { symbol: "BBAR", name: "Banco BBVA Argentina SA", value: 8570 },
  { symbol: "BMA", name: "Banco Macro SA", value: 12850 },
  { symbol: "BYMA", name: "Bolsas y Mercados Argentinos", value: 258 },
  { symbol: "CEPU", name: "Central Puerto", value: 1820 },
  { symbol: "COME", name: "Sociedad Comercial del Plata SA", value: 260.5 },
  { symbol: "CRES", name: "Cresud", value: 1560 },
  { symbol: "EDN", name: "Edenor", value: 2790 },
  { symbol: "GGAL", name: "Grupo Galicia", value: 8070 },
  { symbol: "IRSA", name: "IRSA", value: 1875 },
  { symbol: "LOMA", name: "Loma Negra", value: 2985 },
  { symbol: "METR", name: "Metrogas", value: 2860 },
  { symbol: "PAMP", name: "Pampa Energía", value: 4390 },
  { symbol: "SUPV", name: "Supervielle", value: 3915 },
  { symbol: "TECO2", name: "Telecom", value: 3180 },
  { symbol: "TGNO4", name: "Transportadora de Gas del Norte", value: 4200 },
  { symbol: "TGSU2", name: "Transportadora de Gas del Sur", value: 7700 },
  { symbol: "TRAN", name: "Transener", value: 2830 },
  { symbol: "TXAR", name: "Ternium Argentina", value: 900 },
  { symbol: "VALO", name: "Grupo Financiero Valores SA", value: 451.5 },
  { symbol: "YPFD", name: "YPF", value: 52400 },
];

export function calculateYTDReturns(
  currentPrices: RawAccionData[],
): AccionWithYTD[] {
  return currentPrices
    .map((stock: RawAccionData): AccionWithYTD | AccionWithoutYTD => {
      const baseline = panelLiderYTDBaseline.find(
        (b) => b.symbol === stock.symbol,
      );
      if (!baseline) return { ...stock, ytdReturn: null, name: null };

      const ytdReturn = ((stock.c - baseline.value) / baseline.value) * 100;
      return {
        ...stock,
        name: baseline.name,
        ytdReturn: Number(ytdReturn.toFixed(2)),
      };
    })
    .filter((stock): stock is AccionWithYTD => stock.ytdReturn !== null);
}

export interface Accion {
  symbol: string;
  q_bid: number;
  px_bid: number;
  px_ask: number;
  q_ask: number;
  v: number;
  q_op: number;
  c: number;
  pct_change: number;
  name?: string;
  ytdReturn?: number;
}
