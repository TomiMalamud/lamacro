import { formatDateAR, getNextBusinessDay } from "@/lib/utils";
import { ComparatasasOption, FijaTableRow, SecurityData } from "@/types/fija";
import { parseISO } from "date-fns";
import { TICKER_PROSPECT } from "./constants";
export async function getLetras() {
  const response = await fetch("https://data912.com/live/arg_notes", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}

export async function getBonos() {
  const response = await fetch("https://data912.com/live/arg_bonds", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}

export async function getBilleteras() {
  const response = await fetch(
    "https://api.comparatasas.ar/cuentas-y-billeteras",
    {
      next: { revalidate: 21600 },
    },
  );
  const data = await response.json();
  const filteredData = data.filter(
    (item: ComparatasasOption) => item.currency === "ARS",
  );
  return filteredData;
}

export async function getFondos() {
  const response = await fetch(
    "https://api.comparatasas.ar/funds/rm?name=Cocos%20Daruma%20Renta%20Mixta%20-%20Clase%20A",
    {
      next: { revalidate: 300 },
    },
  );
  const data = await response.json();
  return data;
}

export function calculateDaysDifference(
  endDate: Date,
  startDate: Date,
): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function calculateDays360(endDate: Date, startDate: Date): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const adjustedStartDay = startDay === 31 ? 30 : startDay;
  const adjustedEndDay = endDay === 31 && adjustedStartDay >= 30 ? 30 : endDay;

  return (
    (endYear - startYear) * 360 +
    (endMonth - startMonth) * 30 +
    (adjustedEndDay - adjustedStartDay)
  );
}

export function calculateTNA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return ((pagoFinal / px - 1) / dias) * 365;
}

export function calculateTEM(
  pagoFinal: number,
  px: number,
  meses: number,
): number {
  return Math.pow(pagoFinal / px, 1 / meses) - 1;
}

export function calculateTEA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return Math.pow(pagoFinal / px, 365 / dias) - 1;
}

export function getFijaData(
  letras: SecurityData[],
  bonos: SecurityData[],
): FijaTableRow[] {
  const getPriceForTicker = (ticker: string): number => {
    if (ticker.startsWith("S")) {
      const security = letras.find((item) => item.symbol === ticker);
      return security?.c || 0;
    } else if (ticker.startsWith("T")) {
      const security = bonos.find((item) => item.symbol === ticker);
      return security?.c || 0;
    }
    return 0;
  };

  const baseDate = getNextBusinessDay();

  return TICKER_PROSPECT.map((config) => {
    const fechaVencimiento = parseISO(config.fechaVencimiento);
    const liquiSecuDate =
      baseDate > fechaVencimiento ? fechaVencimiento : baseDate;
    const px = getPriceForTicker(config.ticker);

    const dias = calculateDaysDifference(fechaVencimiento, liquiSecuDate);
    const days360 = calculateDays360(fechaVencimiento, liquiSecuDate);
    const meses = days360 / 30;

    const tna = px > 0 ? calculateTNA(config.pagoFinal, px, dias) : 0;
    const tem =
      px > 0 && meses > 0 ? calculateTEM(config.pagoFinal, px, meses) : 0;
    const tea = px > 0 ? calculateTEA(config.pagoFinal, px, dias) : 0;

    return {
      ticker: config.ticker,
      fechaVencimiento: formatDateAR(fechaVencimiento.toISOString()),
      dias,
      meses,
      px,
      pagoFinal: config.pagoFinal,
      tna,
      tem,
      tea,
    };
  })
    .filter((item) => item.dias > 0)
    .sort((a, b) => a.dias - b.dias);
}
