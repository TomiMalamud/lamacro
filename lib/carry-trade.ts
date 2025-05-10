import { fetchVariableTimeSeries, type BCRAVariable } from "@/lib/bcra-fetch";
import type {
  CarryExitData,
  CarryTradeData,
  MepData,
  ProcessedBondData,
  RawBondData,
} from "@/types/carry-trade";
import {
  addDays,
  addMonths,
  addYears,
  compareAsc,
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
  differenceInDays as originalDifferenceInDays,
  parse,
  parseISO,
  startOfDay,
} from "date-fns";
import { DUAL_BONDS_COLORS } from "@/components/duales-tamar/constants";

const TICKERS: Record<string, string> = {
  S16A5: "2025-04-16",
  S28A5: "2025-04-28",
  S16Y5: "2025-05-16",
  S30Y5: "2025-05-30",
  S18J5: "2025-06-18",
  S30J5: "2025-06-30",
  S31L5: "2025-07-31",
  S15G5: "2025-08-15",
  S29G5: "2025-08-29",
  S12S5: "2025-09-12",
  S30S5: "2025-09-30",
  T17O5: "2025-10-15",
  S31O5: "2025-10-31",
  S10N5: "2025-11-10",
  S28N5: "2025-11-28",
  T15D5: "2025-12-15",
  T30E6: "2026-01-30",
  T13F6: "2026-02-13",
  T30J6: "2026-06-30",
  T15E7: "2027-01-15",
  TTM26: "2026-03-16",
  TTJ26: "2026-06-30",
  TTS26: "2026-09-15",
  TTD26: "2026-12-15",
};

const PAYOFF: Record<string, number> = {
  S16A5: 131.211,
  S28A5: 130.813,
  S16Y5: 136.861,
  S30Y5: 136.331,
  S18J5: 147.695,
  S30J5: 146.607,
  S31L5: 147.74,
  S15G5: 146.794,
  S29G5: 157.7,
  S12S5: 158.977,
  S30S5: 159.734,
  T17O5: 158.872,
  S31O5: 132.821,
  S10N5: 122.254,
  S28N5: 123.561,
  T15D5: 170.838,
  T30E6: 142.222,
  T13F6: 144.966,
  T30J6: 144.896,
  T15E7: 160.777,
  TTM26: 135.238,
  TTJ26: 144.629,
  TTS26: 152.096,
  TTD26: 161.144,
};

const CARRY_PRICES = [1000, 1100, 1200, 1300, 1400];

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

export async function getCarryTradeData(): Promise<CarryTradeData> {
  const [mep, allBonds] = await Promise.all([getMepRate(), getBondData()]);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const carryData = allBonds
    .filter((bond) => TICKERS[bond.symbol]) // Filter only bonds we have data for
    .map((bond) => {
      const expirationDate = parseISO(TICKERS[bond.symbol]);
      const days_to_exp = originalDifferenceInDays(expirationDate, today);

      if (days_to_exp <= 0 || !bond.c || bond.c <= 0) {
        return null; // Skip expired or invalid bonds
      }

      const payoff = PAYOFF[bond.symbol];
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

      const finish_worst = Math.round(1400 * Math.pow(1.01, days_to_exp / 30));
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
        expiration: TICKERS[bond.symbol],
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

  return { carryData, mep };
}

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

// --- Dual Bond TAMAR Analysis ---

export const DUAL_BOND_EVENTS: Record<string, string> = {
  TTM26: "2026-03-16",
  TTJ26: "2026-06-30",
  TTS26: "2026-09-15",
  TTD26: "2026-12-15",
};

const DUAL_BOND_FIXED_RATES: Record<string, number> = {
  TTM26: 0.0225,
  TTJ26: 0.0219,
  TTS26: 0.0217,
  TTD26: 0.0214,
};

const TARGET_FECHA_DUALES = "2026-12-31"; // Equivalent to pd.Timestamp("2026-12-31")

export interface DualBondChartPoint {
  date: string; // YYYY-MM-DD
  tamar_tem_spot?: number;
  tamar_AVG?: number;
  TTM26_fixed_rate?: number;
  TTJ26_fixed_rate?: number;
  TTS26_fixed_rate?: number;
  TTD26_fixed_rate?: number;
  [key: string]: number | string | undefined; // For tamar_proy_X and tamar_proy_X_AVG
}

export interface DualBondTableEntry {
  label: string;
  TTM26: string | number;
  TTJ26: string | number;
  TTS26: string | number;
  TTD26: string | number;
}

export interface DualBondScatterPoint {
  date: string;
  bondTicker: string;
  value: number;
  color: string; // To help styling in the chart
  scenarioLabel: string; // Identifier for the scenario
}
export interface DualBondSimulationResults {
  chartData: DualBondChartPoint[];
  scatterPoints: DualBondScatterPoint[];
  tableDataTemDiff: DualBondTableEntry[];
  tableDataPayoffDiff: DualBondTableEntry[];
  eventDates: Record<string, string>;
}

async function fetchTamarRateV3(variableID: number): Promise<BCRAVariable[]> {
  try {
    // Use fetchVariableTimeSeries from bcra-fetch.ts
    // It handles its own caching, retries, and error throwing.
    const response = await fetchVariableTimeSeries(
      variableID,
      undefined,
      undefined,
      0,
      3000,
    ); // Fetch all available data, up to limit
    return response.results;
  } catch (error) {
    console.error(
      `Failed to fetch TAMAR rate for variableID ${variableID} using fetchVariableTimeSeries:`,
      error,
    );
    return []; // Return empty array on error to allow graceful degradation
  }
}

function calculateExpandingMean(
  values: (number | undefined)[],
): (number | undefined)[] {
  const means: (number | undefined)[] = [];
  let sum = 0;
  let count = 0;
  for (const value of values) {
    if (value !== undefined && !isNaN(value)) {
      sum += value;
      count++;
    }
    // If skipna=True (pandas default), the mean uses all valid numbers up to this point.
    // If current value is skipped, sum/count don't change from previous step for this iteration's calculation.
    if (count > 0) {
      means.push(sum / count);
    } else {
      means.push(undefined); // No valid numbers encountered yet
    }
  }
  return means;
}

// Helper function to get year, month, day components similar to dateutil.relativedelta
function getRelativeParts(
  endDate: Date,
  startDate: Date,
): { years: number; months: number; days: number } {
  const d1 = startOfDay(new Date(endDate)); // Ensure we are comparing day starts
  const d0 = startOfDay(new Date(startDate));

  let years = 0;
  // Calculate full years
  while (compareAsc(addYears(d0, years + 1), d1) <= 0) {
    years++;
  }
  const dateAfterYears = addYears(d0, years);

  let months = 0;
  // Calculate full months after accounting for full years
  while (compareAsc(addMonths(dateAfterYears, months + 1), d1) <= 0) {
    months++;
  }
  const dateAfterMonths = addMonths(dateAfterYears, months);

  // Calculate remaining days
  const days = originalDifferenceInDays(d1, dateAfterMonths);

  return { years, months, days };
}

export async function getDualBondSimulationData(
  targetsTEM: number[],
): Promise<DualBondSimulationResults | null> {
  const tamarDataRaw = await fetchTamarRateV3(45); // ID=45 es la TAMAR
  if (!tamarDataRaw || tamarDataRaw.length === 0) {
    return null;
  }

  const tamarTea = tamarDataRaw
    .map((d) => ({
      date: parse(d.fecha, "yyyy-MM-dd", new Date()),
      value: d.valor / 100,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const filterDateTamar = parse("2025-01-15", "yyyy-MM-dd", new Date());
  const tamarTeaFiltered = tamarTea.filter((d) =>
    isBefore(filterDateTamar, d.date),
  );

  const tamarTemSpot = tamarTeaFiltered.map((d) => ({
    date: d.date,
    value: Math.pow(1 + d.value, 1 / 12) - 1,
  }));

  const allChartPointsMap = new Map<string, DualBondChartPoint>();

  tamarTemSpot.forEach((d) => {
    const dateStr = format(d.date, "yyyy-MM-dd");
    allChartPointsMap.set(dateStr, {
      ...allChartPointsMap.get(dateStr),
      date: dateStr,
      tamar_tem_spot: d.value,
    });
  });

  const startDateProjections =
    tamarTemSpot.length > 0
      ? addDays(tamarTemSpot[tamarTemSpot.length - 1].date, 1)
      : addDays(new Date(), 1); // Fallback if no spot data

  const endDateProjections = parse(
    TARGET_FECHA_DUALES,
    "yyyy-MM-dd",
    new Date(),
  );

  // Python version uses freq='B' (business days).
  const allFutureDates = eachDayOfInterval({
    start: startDateProjections,
    end: endDateProjections,
  });
  const futureDates = allFutureDates.filter((date) => {
    const dayOfWeek = getDay(date); // Sunday is 0, Saturday is 6
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });

  const temActual =
    tamarTemSpot.length > 0 ? tamarTemSpot[tamarTemSpot.length - 1].value : 0; // Fallback

  // Ensure futureDates is not empty before proceeding
  if (futureDates.length === 0) {
    // This case should be handled if TARGET_FECHA_DUALES is very soon or over a weekend.
    // For the current logic, this might lead to diasTotales = 0 or errors if not guarded.
    // Python's date_range would also return empty if start > end.
    // console.warn("No future business dates found for projection.");
    // Depending on desired behavior, could return null or empty chartData earlier.
  }

  const diasTotales =
    futureDates.length > 0
      ? originalDifferenceInDays(
          futureDates[futureDates.length - 1],
          futureDates[0],
        )
      : 0;

  targetsTEM.forEach((targetTEM) => {
    const proyKey = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    futureDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      let projectedValue: number;
      if (diasTotales > 0) {
        const daysDiff = originalDifferenceInDays(date, futureDates[0]);
        projectedValue =
          temActual + ((targetTEM - temActual) * daysDiff) / diasTotales;
      } else {
        projectedValue = targetTEM; // If diasTotales is 0, all future dates are the target
      }
      allChartPointsMap.set(dateStr, {
        ...allChartPointsMap.get(dateStr),
        date: dateStr,
        [proyKey]: projectedValue,
      });
    });
  });

  // Create a sorted array of dates for consistent processing
  const sortedDates = Array.from(allChartPointsMap.keys())
    .sort()
    .map((dateStr) => parse(dateStr, "yyyy-MM-dd", new Date()));

  // Add fixed bond rates and calculate tamar_AVG
  const spotValuesForAvg = sortedDates.map((date) => {
    const point = allChartPointsMap.get(format(date, "yyyy-MM-dd"));
    return point?.tamar_tem_spot;
  });
  const tamarAvgValues = calculateExpandingMean(spotValuesForAvg);

  sortedDates.forEach((date, idx) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const point = allChartPointsMap.get(dateStr) || { date: dateStr };
    point.tamar_AVG = tamarAvgValues[idx];
    Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
      const eventDate = parse(
        DUAL_BOND_EVENTS[bondTicker],
        "yyyy-MM-dd",
        new Date(),
      );
      if (
        isBefore(date, eventDate) ||
        format(date, "yyyy-MM-dd") === DUAL_BOND_EVENTS[bondTicker]
      ) {
        point[`${bondTicker}_fixed_rate`] = DUAL_BOND_FIXED_RATES[bondTicker];
      }
    });
    allChartPointsMap.set(dateStr, point);
  });

  // Calculate projection averages
  targetsTEM.forEach((targetTEM) => {
    const proyKey = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    const proyAvgKey = `${proyKey}_AVG`;

    const valuesForProyAvg = sortedDates.map((date) => {
      const point = allChartPointsMap.get(format(date, "yyyy-MM-dd"));
      // FillNA logic: df["tamar_tem_spot"].fillna(df[p])
      const value =
        point?.tamar_tem_spot ?? (point?.[proyKey] as number | undefined);
      return value;
    });
    const proyAvgValues = calculateExpandingMean(valuesForProyAvg);

    sortedDates.forEach((date, idx) => {
      const point = allChartPointsMap.get(format(date, "yyyy-MM-dd"));
      if (point && point[proyKey] !== undefined) {
        // .where(df[p].notna())
        point[proyAvgKey] = proyAvgValues[idx];
        allChartPointsMap.set(format(date, "yyyy-MM-dd"), point);
      }
    });
  });

  const chartData: DualBondChartPoint[] = Array.from(
    allChartPointsMap.values(),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const scatterPoints: DualBondScatterPoint[] = [];
  const sobreTasaTamarRaw: Record<string, Record<string, number>> = {};

  Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
    sobreTasaTamarRaw[bondTicker] = {};
    const eventDateStr = DUAL_BOND_EVENTS[bondTicker];
    const eventDate = parse(eventDateStr, "yyyy-MM-dd", new Date());
    const tasaFija = DUAL_BOND_FIXED_RATES[bondTicker];

    let pointForEvent = chartData.find((p) => p.date === eventDateStr);
    if (!pointForEvent) {
      // Find first point on or after eventDate
      pointForEvent = chartData.find(
        (p) => !isBefore(parse(p.date, "yyyy-MM-dd", new Date()), eventDate),
      );
    }

    if (pointForEvent) {
      targetsTEM.forEach((targetTEM) => {
        const proyAvgKey = `tamar_proy_${(targetTEM * 100).toFixed(1)}_AVG`;
        const projectedAvgTamar = pointForEvent[proyAvgKey] as
          | number
          | undefined;

        if (projectedAvgTamar !== undefined) {
          scatterPoints.push({
            date: eventDateStr,
            bondTicker: bondTicker,
            value: projectedAvgTamar,
            color:
              DUAL_BONDS_COLORS[bondTicker] || DUAL_BONDS_COLORS.projection_AVG,
            scenarioLabel: proyAvgKey,
          });
          if (projectedAvgTamar > tasaFija) {
            sobreTasaTamarRaw[bondTicker][proyAvgKey] =
              projectedAvgTamar - tasaFija;
          } else {
            sobreTasaTamarRaw[bondTicker][proyAvgKey] = 0;
          }
        } else {
          sobreTasaTamarRaw[bondTicker][proyAvgKey] = 0; // If no projection, diff is 0
        }
      });
    }
  });

  // Table calculations (from showTables)
  const tableDataTemDiff: DualBondTableEntry[] = [];
  const tableDataPayoffDiff: DualBondTableEntry[] = [];

  // Python's base date for offset calculation: pd.Timestamp(2025, 1, 29)
  // The Python script effectively calculates 'meses' relative to this base date.
  const baseDateForPayoffCalc = startOfDay(
    parse("2025-01-29", "yyyy-MM-dd", new Date()),
  );

  const mesesPayoff: Record<string, number> = {};
  Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
    const eventDate = startOfDay(
      parse(DUAL_BOND_EVENTS[bondTicker], "yyyy-MM-dd", new Date()),
    );

    // Calculate {years, months, days} difference between eventDate and baseDateForPayoffCalc
    const { years, months, days } = getRelativeParts(
      eventDate,
      baseDateForPayoffCalc,
    );

    // Python formula: years * 12 + months + days / 30
    mesesPayoff[bondTicker] = years * 12 + months + days / 30.0;
  });

  targetsTEM.forEach((targetTEM) => {
    const scenarioLabelPrefix = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    const proyAvgKeySuffix = "_AVG";

    // Initialize all properties for DualBondTableEntry
    const temDiffRow: DualBondTableEntry = {
      label: `con TAMAR ${(targetTEM * 100).toFixed(1)}% => dic-26`,
      TTM26: "0.00%",
      TTJ26: "0.00%",
      TTS26: "0.00%",
      TTD26: "0.00%", // Initial default values
    };
    const payoffDiffRow: DualBondTableEntry = {
      label: `con TAMAR ${(targetTEM * 100).toFixed(1)}% => dic-26`,
      TTM26: "0.00%",
      TTJ26: "0.00%",
      TTS26: "0.00%",
      TTD26: "0.00%", // Initial default values
    };

    Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
      const scenarioKey = `${scenarioLabelPrefix}${proyAvgKeySuffix}`;
      const diffTem = (sobreTasaTamarRaw[bondTicker]?.[scenarioKey] ?? 0) * 100;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (temDiffRow as any)[bondTicker] = `${diffTem.toFixed(2)}%`;

      const r = diffTem / 100;
      const meses = mesesPayoff[bondTicker];
      const payoff = (Math.pow(1 + r, meses) - 1) * 100;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payoffDiffRow as any)[bondTicker] = `${payoff.toFixed(2)}%`;
    });
    tableDataTemDiff.push(temDiffRow);
    tableDataPayoffDiff.push(payoffDiffRow);
  });

  // Initialize all properties for DualBondTableEntry
  const mesesRow: DualBondTableEntry = {
    label: "Meses de payoff",
    TTM26: "0.00",
    TTJ26: "0.00",
    TTS26: "0.00",
    TTD26: "0.00", // Initial default values
  };
  Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mesesRow as any)[bondTicker] = mesesPayoff[bondTicker].toFixed(2);
  });
  tableDataTemDiff.push(mesesRow);
  tableDataPayoffDiff.push(mesesRow);

  return {
    chartData,
    scatterPoints,
    tableDataTemDiff,
    tableDataPayoffDiff,
    eventDates: DUAL_BOND_EVENTS,
  };
}
