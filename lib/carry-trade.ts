import type {
  CarryExitData,
  CarryTradeData,
  MepData,
  ProcessedBondData,
  RawBondData,
} from "@/types/carry-trade";
import {
  differenceInDays as originalDifferenceInDays,
  parseISO,
} from "date-fns";
import { cache } from "react";
import { getHydratedTickerProspect } from "@/lib/ticker-prospect";

const CARRY_PRICES = [1000, 1100, 1200, 1300, 1400];

export function getCurrentUpperLimit(): number {
  const startDate = new Date(2025, 3, 14); // April 14, 2025 (month is 0-indexed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upperValue = 1400;

  // If today is before or on the start date, return the initial value
  if (today <= startDate) {
    return upperValue;
  }

  // Calculate first partial month (April 14 to May 1 = 17 days)
  const may1 = new Date(2025, 4, 1); // May 1, 2025
  if (today > startDate) {
    const daysToMay1 = 17;
    const partialMonthRatio = daysToMay1 / 30;
    upperValue = upperValue * (1 + 0.01 * partialMonthRatio);

    // If today is before May 1, calculate partial growth and return
    if (today < may1) {
      const daysFromStart = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const currentPartialRatio = daysFromStart / 30;
      return 1400 * (1 + 0.01 * currentPartialRatio);
    }
  }

  // Calculate full months from May 1, 2025 to today
  const currentDate = new Date(2025, 4, 1); // Start from May 1, 2025
  while (currentDate < today) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate <= today) {
      upperValue = upperValue * 1.01;
    }
  }

  return Math.round(upperValue);
}

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

async function getMepRate(): Promise<number> {
  const mepData = await fetchJson<MepData[]>("https://data912.com/live/mep");
  if (!mepData || mepData.length === 0) {
    console.warn("MEP data is empty or unavailable, returning 0.");
    return 0;
  }

  // Extract all close values and sort them numerically
  const allCloseValues = mepData.map((d) => d.close).sort((a, b) => a - b);
  const len = allCloseValues.length;

  if (len === 0) {
    console.warn("No valid close values found in MEP data, returning 0.");
    return 0;
  }

  // Calculate median
  const mid = Math.floor(len / 2);
  if (len % 2 === 0) {
    // Even number of values: average of the two middle ones
    return (allCloseValues[mid - 1] + allCloseValues[mid]) / 2;
  } else {
    // Odd number of values: the middle one
    return allCloseValues[mid];
  }
}

async function getBondData(): Promise<RawBondData[]> {
  const [notes, bonds] = await Promise.all([
    fetchJson<RawBondData[]>("https://data912.com/live/arg_notes"),
    fetchJson<RawBondData[]>("https://data912.com/live/arg_bonds"),
  ]);
  return [...notes, ...bonds];
}

export const getCarryTradeData = cache(async (): Promise<CarryTradeData> => {
  const [actualMep, allBonds, tickerProspect] = await Promise.all([
    getMepRate(),
    getBondData(),
    getHydratedTickerProspect(),
  ]);
  const mep = actualMep;
  const tickerBySymbol = new Map(
    tickerProspect.map((entry) => [entry.ticker, entry] as const),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const current = getCurrentUpperLimit();
  const carryData = allBonds
    .filter((bond) => tickerBySymbol.has(bond.symbol)) // Filter only bonds we have data for
    .map((bond) => {
      const tickerConfig = tickerBySymbol.get(bond.symbol);
      if (!tickerConfig) return null;

      const expirationDate = parseISO(tickerConfig.fechaVencimiento);
      const days_to_exp = originalDifferenceInDays(expirationDate, today);

      if (days_to_exp <= 0 || !bond.c || bond.c <= 0) {
        return null; // Skip expired or invalid bonds
      }

      const payoff = tickerConfig.pagoFinal;
      const ratio = payoff / bond.c;
      const daysFactor = 365 / days_to_exp;
      const monthlyFactor = 30 / days_to_exp;

      const tna = (ratio - 1) * daysFactor;
      const tea = Math.pow(ratio, daysFactor) - 1;
      const tem = Math.pow(ratio, monthlyFactor) - 1;

      const tem_bid =
        bond.px_bid > 0
          ? Math.pow(payoff / bond.px_bid, monthlyFactor) - 1
          : NaN;
      const tem_ask =
        bond.px_ask > 0
          ? Math.pow(payoff / bond.px_ask, monthlyFactor) - 1
          : NaN;

      const finish_worst = Math.round(
        current * Math.pow(1.01, days_to_exp / 30),
      );
      const mep_breakeven = mep * ratio;
      const carry_worst = (ratio * mep) / finish_worst - 1;
      const carry_mep = ratio - 1; // Calculate carry assuming exit MEP equals current MEP

      const carries: Record<string, number> = {};
      CARRY_PRICES.forEach((price) => {
        carries[`carry_${price}`] = (ratio * mep) / price - 1;
      });

      return {
        ...bond,
        bond_price: bond.c,
        payoff: payoff,
        expiration: tickerConfig.fechaVencimiento,
        days_to_exp: days_to_exp,
        tna: tna,
        tea: tea,
        tem: tem,
        tem_bid: tem_bid,
        tem_ask: tem_ask,
        finish_worst: finish_worst,
        mep_breakeven: mep_breakeven,
        carry_worst: carry_worst,
        carry_mep: carry_mep,
        ...carries,
      } as ProcessedBondData;
    })
    .filter((bond): bond is ProcessedBondData => bond !== null) // Type guard
    .sort(
      (a: ProcessedBondData, b: ProcessedBondData) =>
        a.days_to_exp - b.days_to_exp,
    ); // Sort by days to expiration

  return { carryData, mep, actualMep };
});

// --- Early Exit Simulation ---
export const CPI_EST = 0.01; // Estimated general monthly interest rate (TEM)
export const EST_DATE_STR = "2025-10-15"; // Exit date assumption

export async function getCarryExitSimulation(): Promise<CarryExitData[]> {
  const { carryData } = await getCarryTradeData(); // Reuse fetched & base processed data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const estDate = parseISO(EST_DATE_STR);

  const simulationData = carryData
    .map((bond: ProcessedBondData) => {
      // Add type for bond
      const expirationDate = parseISO(bond.expiration);
      const days_in = originalDifferenceInDays(estDate, today);
      const days_to_exp_from_exit = originalDifferenceInDays(
        expirationDate,
        estDate,
      );

      if (days_in <= 0 || days_to_exp_from_exit <= 0) {
        return null; // Skip if exit date is past or bond expires before exit
      }

      const bond_price_out =
        bond.payoff / Math.pow(1 + CPI_EST, days_to_exp_from_exit / 30);
      const ars_direct_yield = bond_price_out / bond.bond_price - 1;
      const ars_tea = Math.pow(1 + ars_direct_yield, 365 / days_in) - 1;

      return {
        symbol: bond.symbol,
        days_in: days_in,
        payoff: bond.payoff,
        expiration: bond.expiration,
        days_to_exp: days_to_exp_from_exit,
        exit_TEM: CPI_EST,
        bond_price_in: bond.bond_price,
        bond_price_out: bond_price_out,
        ars_direct_yield: ars_direct_yield,
        ars_tea: ars_tea,
      } as CarryExitData;
    })
    .filter((sim): sim is CarryExitData => sim !== null) // Type guard
    .sort(
      (a: CarryExitData, b: CarryExitData) => a.days_to_exp - b.days_to_exp,
    );

  return simulationData;
}

export {};
