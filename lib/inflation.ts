import { fetchVariableTimeSeries, BCRAResponse } from "./bcra-fetch";
import historicalInflation from "./historical-inflation.json";

export type InflationRates = Record<string, Record<string, number>>;

const typedHistoricalInflation = historicalInflation as InflationRates;

function convertBCRAtoInflationFormat(data: BCRAResponse): InflationRates {
  const result: InflationRates = {};

  data.results.forEach((item) => {
    const date = new Date(item.fecha);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString();

    const inflationRate = item.valor / 100;

    if (!result[year]) {
      result[year] = {};
    }

    result[year][month] = inflationRate;
  });

  return result;
}

export async function getCombinedInflationData(): Promise<InflationRates> {
  try {
    // Fetch recent inflation data from BCRA API (variable 27 is inflation)
    // Start from 2025-03 since historical data goes up to 2025-02
    const desde = "2025-03-01";
    const bcraData = await fetchVariableTimeSeries(27, desde);
    const recentInflationData = convertBCRAtoInflationFormat(bcraData);
    const combinedData: InflationRates = { ...typedHistoricalInflation };

    Object.keys(recentInflationData).forEach((year) => {
      if (!combinedData[year]) {
        combinedData[year] = {};
      }
      Object.keys(recentInflationData[year]).forEach((month) => {
        combinedData[year][month] = recentInflationData[year][month];
      });
    });

    return combinedData;
  } catch (error) {
    console.error("Failed to fetch recent inflation data from BCRA:", error);
    return typedHistoricalInflation;
  }
}

export function getMonthName(month: number): string {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString("es-AR", { month: "long" });
}

export function calculateInflation(
  startMonth: number,
  startYear: number,
  startValue: number,
  endMonth: number,
  endYear: number,
  inflationData: InflationRates,
): {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  totalIncrement: number;
  totalIncrementPercentage: number;
  monthlyAveragePercentage: number;
  annualizedPercentage: number;
} {
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  if (totalMonths === 0) {
    return {
      startDate: `${getMonthName(startMonth)} ${startYear}`,
      endDate: `${getMonthName(endMonth)} ${endYear}`,
      startValue,
      endValue: startValue,
      totalIncrement: 0,
      totalIncrementPercentage: 0,
      monthlyAveragePercentage: 0,
      annualizedPercentage: 0,
    };
  }

  let currentValue = startValue;
  let currentMonth = startMonth;
  let currentYear = startYear;

  for (let i = 0; i < totalMonths; i++) {
    // Apply inflation for current month, then move to next month
    const yearData = inflationData[currentYear.toString()] || {};
    const monthRate = yearData[currentMonth.toString()] || 0;

    currentValue = currentValue * (1 + monthRate);

    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  const endValue = Math.round(currentValue * 100) / 100;
  const absoluteIncrement = endValue - startValue;
  const incrementPercentage = absoluteIncrement / startValue;
  const monthlyAveragePercentage =
    totalMonths > 0 ? Math.pow(endValue / startValue, 1 / totalMonths) - 1 : 0;
  const annualizedPercentage =
    totalMonths > 0 ? Math.pow(endValue / startValue, 12 / totalMonths) - 1 : 0;

  return {
    startDate: `${getMonthName(startMonth)} ${startYear}`,
    endDate: `${getMonthName(endMonth)} ${endYear}`,
    startValue,
    endValue,
    totalIncrement: absoluteIncrement,
    totalIncrementPercentage: incrementPercentage,
    monthlyAveragePercentage: monthlyAveragePercentage,
    annualizedPercentage: annualizedPercentage,
  };
}
