import { describe, it, expect } from "vitest";
import { calculateInflation, InflationRates } from "../inflation";

describe("calculateInflation", () => {
  const mockInflationData: InflationRates = {
    "2024": {
      "7": 0.04,
      "8": 0.042,
      "9": 0.035,
      "10": 0.027,
      "11": 0.024,
      "12": 0.027,
    },
    "2025": {
      "1": 0.022,
      "2": 0.024,
      "3": 0.037000000000000005,
      "4": 0.027999999999999997,
      "5": 0.015,
      "6": 0.016,
    },
  };

  it("should calculate correct inflation from July 2024 to July 2025", () => {
    const result = calculateInflation(
      7, // startMonth
      2024, // startYear
      1000, // startValue
      7, // endMonth
      2025, // endYear
      mockInflationData,
    );

    expect(result.endValue).toBeCloseTo(1393.69, 2);
  });

  it("should handle same month calculation", () => {
    const result = calculateInflation(
      7, // startMonth
      2024, // startYear
      1000, // startValue
      7, // endMonth
      2024, // endYear - same year and month
      mockInflationData,
    );

    expect(result.endValue).toBe(1000);
    expect(result.totalIncrement).toBe(0);
  });
});
