import {
  addMonths,
  isBefore,
  parse,
  format,
  addDays,
  eachDayOfInterval,
  getDay,
  differenceInDays as originalDifferenceInDays,
} from "date-fns";
import { addYears } from "date-fns";
import { startOfDay } from "date-fns";
import { compareAsc } from "date-fns";
import { fetchVariableTimeSeries } from "./bcra-fetch";
import { BCRAVariable } from "./bcra-fetch";
import { DUAL_BONDS_COLORS } from "@/components/duales-tamar/duales-chart";

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

const TARGET_FECHA_DUALES = "2026-12-31";

const REM_50 = 18.51 / 100;
const REM_75 = 21.8 / 100;
const REM_25 = 15.6 / 100;

const ALL_PROJECTION_SCENARIOS_TEM: number[] = [
  REM_25 / 12,
  REM_50 / 12,
  REM_75 / 12,
];
const MIN_SCENARIO_TEM = 0.005;
const MAX_SCENARIO_TEM = 0.055;
const SCENARIO_TEM_STEP = 0.005;

for (
  let tem = MIN_SCENARIO_TEM;
  tem <= MAX_SCENARIO_TEM + SCENARIO_TEM_STEP / 2;
  tem += SCENARIO_TEM_STEP
) {
  ALL_PROJECTION_SCENARIOS_TEM.push(parseFloat(tem.toFixed(4)));
}

export interface DualBondChartPoint {
  date: string; // YYYY-MM-DD
  tamar_tem_spot?: number;
  tamar_AVG?: number;
  TTM26_fixed_rate?: number;
  TTJ26_fixed_rate?: number;
  TTS26_fixed_rate?: number;
  TTD26_fixed_rate?: number;
  [key: string]: number | string | undefined;
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
    const response = await fetchVariableTimeSeries(
      variableID,
      undefined,
      undefined,
      0,
      3000,
    );
    return response.results;
  } catch (error) {
    console.error(
      `Failed to fetch TAMAR rate for variableID ${variableID} using fetchVariableTimeSeries:`,
      error,
    );
    return [];
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
    if (count > 0) {
      means.push(sum / count);
    } else {
      means.push(undefined);
    }
  }
  return means;
}

function getRelativeParts(
  endDate: Date,
  startDate: Date,
): { years: number; months: number; days: number } {
  const d1 = startOfDay(new Date(endDate));
  const d0 = startOfDay(new Date(startDate));

  let years = 0;
  while (compareAsc(addYears(d0, years + 1), d1) <= 0) {
    years++;
  }
  const dateAfterYears = addYears(d0, years);

  let months = 0;
  while (compareAsc(addMonths(dateAfterYears, months + 1), d1) <= 0) {
    months++;
  }
  const dateAfterMonths = addMonths(dateAfterYears, months);

  const days = originalDifferenceInDays(d1, dateAfterMonths);

  return { years, months, days };
}

export async function getDualBondSimulationData(
  activeTargetsTEM: number[],
): Promise<DualBondSimulationResults | null> {
  const tamarDataRaw = await fetchTamarRateV3(45);
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
      : addDays(new Date(), 1);

  const endDateProjections = parse(
    TARGET_FECHA_DUALES,
    "yyyy-MM-dd",
    new Date(),
  );

  const allFutureDates = eachDayOfInterval({
    start: startDateProjections,
    end: endDateProjections,
  });
  const futureDates = allFutureDates.filter((date) => {
    const dayOfWeek = getDay(date);
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });

  const temActual =
    tamarTemSpot.length > 0 ? tamarTemSpot[tamarTemSpot.length - 1].value : 0; // Fallback

  if (futureDates.length === 0) {
  }

  const diasTotales =
    futureDates.length > 0
      ? originalDifferenceInDays(
          futureDates[futureDates.length - 1],
          futureDates[0],
        )
      : 0;

  ALL_PROJECTION_SCENARIOS_TEM.forEach((targetTEM) => {
    const proyKey = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    futureDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      let projectedValue: number;
      if (diasTotales > 0) {
        const daysDiff = originalDifferenceInDays(date, futureDates[0]);
        projectedValue =
          temActual + ((targetTEM - temActual) * daysDiff) / diasTotales;
      } else {
        projectedValue = targetTEM;
      }
      allChartPointsMap.set(dateStr, {
        ...allChartPointsMap.get(dateStr),
        date: dateStr,
        [proyKey]: projectedValue,
      });
    });
  });

  const sortedDates = Array.from(allChartPointsMap.keys())
    .sort()
    .map((dateStr) => parse(dateStr, "yyyy-MM-dd", new Date()));

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

  ALL_PROJECTION_SCENARIOS_TEM.forEach((targetTEM) => {
    const proyKey = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    const proyAvgKey = `${proyKey}_AVG`;

    const valuesForProyAvg = sortedDates.map((date) => {
      const point = allChartPointsMap.get(format(date, "yyyy-MM-dd"));
      const value =
        point?.tamar_tem_spot ?? (point?.[proyKey] as number | undefined);
      return value;
    });
    const proyAvgValues = calculateExpandingMean(valuesForProyAvg);

    sortedDates.forEach((date, idx) => {
      const point = allChartPointsMap.get(format(date, "yyyy-MM-dd"));
      if (point && point[proyKey] !== undefined) {
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
      pointForEvent = chartData.find(
        (p) => !isBefore(parse(p.date, "yyyy-MM-dd", new Date()), eventDate),
      );
    }

    if (pointForEvent) {
      if (activeTargetsTEM && activeTargetsTEM.length > 0) {
        const activeSliderTEM = activeTargetsTEM[0];
        const activeProyAvgKey = `tamar_proy_${(activeSliderTEM * 100).toFixed(1)}_AVG`;
        const activeProjectedAvgTamar = pointForEvent[activeProyAvgKey] as
          | number
          | undefined;

        if (activeProjectedAvgTamar !== undefined) {
          scatterPoints.push({
            date: eventDateStr,
            bondTicker: bondTicker,
            value: activeProjectedAvgTamar,
            color:
              DUAL_BONDS_COLORS[bondTicker] || DUAL_BONDS_COLORS.projection_AVG,
            scenarioLabel: activeProyAvgKey,
          });
        }
      }

      ALL_PROJECTION_SCENARIOS_TEM.forEach((tableScenarioTEM) => {
        const proyAvgKeyForTable = `tamar_proy_${(tableScenarioTEM * 100).toFixed(1)}_AVG`;
        const projectedAvgTamarForTable = pointForEvent[proyAvgKeyForTable] as
          | number
          | undefined;

        if (projectedAvgTamarForTable !== undefined) {
          if (projectedAvgTamarForTable > tasaFija) {
            sobreTasaTamarRaw[bondTicker][proyAvgKeyForTable] =
              projectedAvgTamarForTable - tasaFija;
          } else {
            sobreTasaTamarRaw[bondTicker][proyAvgKeyForTable] = 0;
          }
        } else {
          sobreTasaTamarRaw[bondTicker][proyAvgKeyForTable] = 0;
        }
      });
    }
  });

  const tableDataTemDiff: DualBondTableEntry[] = [];
  const tableDataPayoffDiff: DualBondTableEntry[] = [];

  const baseDateForPayoffCalc = startOfDay(
    parse("2025-01-29", "yyyy-MM-dd", new Date()),
  );

  const mesesPayoff: Record<string, number> = {};
  Object.keys(DUAL_BOND_EVENTS).forEach((bondTicker) => {
    const eventDate = startOfDay(
      parse(DUAL_BOND_EVENTS[bondTicker], "yyyy-MM-dd", new Date()),
    );

    const { years, months, days } = getRelativeParts(
      eventDate,
      baseDateForPayoffCalc,
    );

    mesesPayoff[bondTicker] = years * 12 + months + days / 30.0;
  });

  ALL_PROJECTION_SCENARIOS_TEM.forEach((targetTEM) => {
    const scenarioLabelPrefix = `tamar_proy_${(targetTEM * 100).toFixed(1)}`;
    const proyAvgKeySuffix = "_AVG";

    const temDiffRow: DualBondTableEntry = {
      label: `TAMAR ${(targetTEM * 100).toFixed(1)}%`,
      TTM26: "0.00%",
      TTJ26: "0.00%",
      TTS26: "0.00%",
      TTD26: "0.00%",
    };
    const payoffDiffRow: DualBondTableEntry = {
      label: `TAMAR ${(targetTEM * 100).toFixed(1)}%`,
      TTM26: "0.00%",
      TTJ26: "0.00%",
      TTS26: "0.00%",
      TTD26: "0.00%",
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

  const mesesRow: DualBondTableEntry = {
    label: "Meses de payoff",
    TTM26: "0.00",
    TTJ26: "0.00",
    TTS26: "0.00",
    TTD26: "0.00",
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
