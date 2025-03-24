// This component handles the calculation logic for inflation
// For now using mock data until we connect to real API

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
}

// Mock inflation rates by month and year
const mockMonthlyInflationRates: Record<string, Record<number, number>> = {
  // 2021
  "2021": {
    1: 0.041, // 4.1%
    2: 0.038,
    3: 0.042,
    4: 0.046,
    5: 0.038,
    6: 0.033,
    7: 0.030,
    8: 0.028,
    9: 0.032,
    10: 0.036,
    11: 0.030,
    12: 0.035,
  },
  // 2022
  "2022": {
    1: 0.038,
    2: 0.042,
    3: 0.063,
    4: 0.058,
    5: 0.055,
    6: 0.051,
    7: 0.071,
    8: 0.069,
    9: 0.063,
    10: 0.066,
    11: 0.049,
    12: 0.051,
  },
  // 2023
  "2023": {
    1: 0.060,
    2: 0.063,
    3: 0.074,
    4: 0.087,
    5: 0.075,
    6: 0.062,
    7: 0.064,
    8: 0.124,
    9: 0.128,
    10: 0.087,
    11: 0.125,
    12: 0.252,
  },
  // 2024
  "2024": {
    1: 0.205,
    2: 0.138,
    3: 0.112,
    4: 0.089,
    5: 0.075,
    6: 0.065,
    7: 0.062,
    8: 0.055,
    9: 0.051,
    10: 0.048,
    11: 0.0243,
    12: 0.027,
  },
};

// Helper function to get month name
export const getMonthName = (month: number): string => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString('es-AR', { month: 'long' });
};

const InflationCalculator = ({
  startMonth,
  startYear,
  startValue,
  endMonth,
  endYear,
}: InflationCalculatorProps): InflationResult => {
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
    const yearData = mockMonthlyInflationRates[currentYear.toString()] || {};
    const monthRate = yearData[currentMonth] || 0.03; // Default to 3% if no data
    
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
  const incrementPercentage = (absoluteIncrement / startValue) * 100;
  const monthlyAveragePercentage = totalMonths > 0 ? 
    (Math.pow(endValue / startValue, 1 / totalMonths) - 1) * 100 : 0;
  const annualizedPercentage = totalMonths > 0 ? 
    (Math.pow(endValue / startValue, 12 / totalMonths) - 1) * 100 : 0;
  
  return {
    startDate: `${getMonthName(startMonth)} ${startYear}`,
    endDate: `${getMonthName(endMonth)} ${endYear}`,
    startValue,
    endValue,
    totalIncrement: absoluteIncrement,
    totalIncrementPercentage: Math.round(incrementPercentage * 100) / 100,
    monthlyAveragePercentage: Math.round(monthlyAveragePercentage * 100) / 100,
    annualizedPercentage: Math.round(annualizedPercentage * 100) / 100,
  };
};

export default InflationCalculator; 