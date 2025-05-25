// This component handles the calculation logic for inflation
// Using historical data and BCRA API for recent data
import historicalInflation from "@/lib/historical-inflation.json";
import { fetchVariableTimeSeries, BCRAResponse } from "@/lib/bcra-fetch";
import { useEffect, useState } from "react";

interface InflationCalculatorProps {
  startMonth: number;
  startYear: number;
  startValue: number;
  endMonth: number;
  endYear: number;
}

export interface InflationResult {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  totalIncrement: number;
  totalIncrementPercentage: number;
  monthlyAveragePercentage: number;
  annualizedPercentage: number;
  loading?: boolean;
  error?: string;
}

// Type for our combined inflation data
export type InflationRates = Record<string, Record<string, number>>;

// Properly type the imported JSON data
const typedHistoricalInflation = historicalInflation as InflationRates;

// Global cache for API data to avoid refetching
let apiDataCache: InflationRates = {};
let isApiDataFetching = false;
let apiDataError: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600000; // 1 hour cache

// Helper function to determine if we need to fetch from API
const needsFreshData = (endYear: number, endMonth: number): boolean => {
  const latestDataYear = Math.max(
    ...Object.keys(typedHistoricalInflation).map(Number),
  );
  const latestDataMonth = Math.max(
    ...Object.keys(
      typedHistoricalInflation[latestDataYear.toString()] || {},
    ).map(Number),
  );

  // We need fresh data if requesting data beyond what's in the historical JSON
  return (
    endYear > latestDataYear ||
    (endYear === latestDataYear && endMonth > latestDataMonth)
  );
};

// Helper function to convert BCRA API data to our format
const convertBCRAtoInflationFormat = (data: BCRAResponse): InflationRates => {
  const result: InflationRates = {};

  data.results.forEach((item) => {
    // BCRA format is YYYY-MM-DD, extract year and month
    const date = new Date(item.fecha);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString();

    // Convert percentage to decimal (e.g., 4.2% -> 0.042)
    const inflationRate = item.valor / 100;

    // Initialize year object if it doesn't exist
    if (!result[year]) {
      result[year] = {};
    }

    // Add the month data
    result[year][month] = inflationRate;
  });

  return result;
};

// Function to prefetch API data if needed - returns a promise
export const prefetchInflationData = async (): Promise<void> => {
  const now = Date.now();

  // If cache is fresh, don't fetch again
  if (Object.keys(apiDataCache).length > 0 && now - lastFetchTime < CACHE_TTL) {
    return;
  }

  if (isApiDataFetching) {
    // Wait for existing fetch to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isApiDataFetching) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  isApiDataFetching = true;
  apiDataError = null;

  try {
    // Fetch data from BCRA API (variable 27 is inflation)
    const response = await fetchVariableTimeSeries(27);
    const bcraFormatted = convertBCRAtoInflationFormat(response);

    // Update cache
    apiDataCache = bcraFormatted;
    lastFetchTime = now;
  } catch (err) {
    console.error("Failed to fetch inflation data:", err);
    apiDataError = "Failed to fetch latest inflation data";
  } finally {
    isApiDataFetching = false;
  }
};

// Helper function to get month name
export const getMonthName = (month: number): string => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString("es-AR", { month: "long" });
};

// Create a custom hook to manage inflation data including any fresh data needed
export const useInflationData = () => {
  const [combinedData, setCombinedData] = useState<InflationRates>(
    typedHistoricalInflation,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        await prefetchInflationData();

        if (isMounted) {
          // Merge with historical data, prioritizing newer API data
          setCombinedData({
            ...typedHistoricalInflation,
            ...apiDataCache,
          });

          setError(apiDataError);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error in useInflationData:", err);
          setError("Failed to load inflation data");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { inflationData: combinedData, loading, error };
};

// Pure calculation function that doesn't use hooks
const calculateInflation = (
  startMonth: number,
  startYear: number,
  startValue: number,
  endMonth: number,
  endYear: number,
  inflationData: InflationRates,
): Omit<InflationResult, "loading" | "error"> => {
  // Calculate total months between dates
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  // If same month and year, no inflation applies
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

  // Calculate end value using compounding monthly rates
  let currentValue = startValue;
  let currentMonth = startMonth;
  let currentYear = startYear;

  // Apply inflation for each month (excluding the end month)
  for (let i = 0; i < totalMonths; i++) {
    const yearData = inflationData[currentYear.toString()] || {};
    const monthRate = yearData[currentMonth.toString()] || 0.03; // Default to 3% if no data

    // Apply inflation
    currentValue = currentValue * (1 + monthRate);

    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  // Round to 2 decimal places for currency values
  const endValue = Math.round(currentValue * 100) / 100;

  // Calculate increments
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
};

// The main function that can be used without hooks - combines all historical and API data
const InflationCalculator = (
  props: InflationCalculatorProps,
): InflationResult => {
  // Use the combined data from historical + any cached API data
  const combinedData = {
    ...typedHistoricalInflation,
    ...apiDataCache,
  };

  // Check if we need to fetch but don't have the data yet
  const needsFetch =
    needsFreshData(props.endYear, props.endMonth) &&
    Object.keys(apiDataCache).length === 0;

  // Calculate results with available data
  const results = calculateInflation(
    props.startMonth,
    props.startYear,
    props.startValue,
    props.endMonth,
    props.endYear,
    combinedData,
  );

  // If we're missing needed data, trigger a prefetch for next time but don't wait
  if (needsFetch && !isApiDataFetching) {
    prefetchInflationData().catch(console.error);
  }

  // Return results with loading/error states
  return {
    ...results,
    loading: isApiDataFetching && needsFetch,
    error: apiDataError || undefined,
  };
};

// React component version that uses hooks - use this in React components
export const InflationCalculatorComponent = (
  props: InflationCalculatorProps,
): InflationResult => {
  const { inflationData, loading, error } = useInflationData();

  const results = calculateInflation(
    props.startMonth,
    props.startYear,
    props.startValue,
    props.endMonth,
    props.endYear,
    inflationData,
  );

  return {
    ...results,
    loading,
    error: error || undefined,
  };
};

export default InflationCalculator;
