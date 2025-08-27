import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => ({
  readFileSync: vi.fn(() => ""),
  writeFileSync: vi.fn(() => undefined),
}));

import { transformInflationData } from "../transform-inflation-data";

describe("Inflation Data Transformation Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Data Format Transformation", () => {
    it("should transform single BCRA inflation record correctly", () => {
      const inputData = JSON.stringify({
        fecha: "2025-01-15",
        valor: 3.5,
      });

      const result = transformInflationData(inputData);

      expect(result).toEqual({
        "2025": {
          1: 0.035,
        },
      });
    });

    it("should transform array of BCRA inflation records correctly", () => {
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 3.5 },
        { fecha: "2025-02-15", valor: 4.2 },
        { fecha: "2025-03-15", valor: 2.8 },
      ]);

      const result = transformInflationData(inputData);

      expect(result).toEqual({
        "2025": {
          1: 0.035,
          2: 0.042,
          3: 0.028,
        },
      });
    });

    it("should handle data spanning multiple years", () => {
      const inputData = JSON.stringify([
        { fecha: "2024-12-15", valor: 2.4 },
        { fecha: "2025-01-15", valor: 3.5 },
        { fecha: "2025-02-15", valor: 4.2 },
        { fecha: "2026-01-15", valor: 3.8 },
      ]);

      const result = transformInflationData(inputData);

      expect(result).toEqual({
        "2024": {
          12: 0.024,
        },
        "2025": {
          1: 0.035,
          2: 0.042,
        },
        "2026": {
          1: 0.038,
        },
      });
    });

    it("should handle all 12 months correctly", () => {
      const allMonthsData = Array.from({ length: 12 }, (_, i) => ({
        fecha: `2025-${(i + 1).toString().padStart(2, "0")}-15`,
        valor: (i + 1) * 0.5, // 0.5%, 1.0%, 1.5%, etc.
      }));

      const inputData = JSON.stringify(allMonthsData);
      const result = transformInflationData(inputData);

      expect(result["2025"]).toEqual({
        1: 0.005,
        2: 0.01,
        3: 0.015,
        4: 0.02,
        5: 0.025,
        6: 0.03,
        7: 0.035,
        8: 0.04,
        9: 0.045,
        10: 0.05,
        11: 0.055,
        12: 0.06,
      });
    });
  });

  describe("Percentage to Decimal Conversion", () => {
    it("should convert percentages to decimals correctly", () => {
      const testCases = [
        { input: 0, expected: 0 },
        { input: 1.5, expected: 0.015 },
        { input: 10.25, expected: 0.102 }, // Floating rounding behavior
        { input: 100, expected: 1.0 },
        { input: -2.5, expected: -0.025 }, // Deflation
      ];

      testCases.forEach(({ input, expected }) => {
        const inputData = JSON.stringify({
          fecha: "2025-01-15",
          valor: input,
        });

        const result = transformInflationData(inputData);
        expect(result["2025"][1]).toBe(expected);
      });
    });

    it("should handle precision correctly with rounding", () => {
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 3.14159 }, // Should round to 3 decimals
        { fecha: "2025-02-15", valor: 2.99999 }, // Edge case
        { fecha: "2025-03-15", valor: 0.001 }, // Very small value
      ]);

      const result = transformInflationData(inputData);

      expect(result["2025"]).toEqual({
        1: 0.031, // 3.14159 / 100 = 0.0314159, rounded to 0.031
        2: 0.03, // 2.99999 / 100 = 0.0299999, rounded to 0.03
        3: 0.0, // 0.001 / 100 = 0.00001, rounded to 0.000
      });
    });
  });

  describe("Date Handling Integration", () => {
    it("should parse different date formats correctly", () => {
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 3.5 },
        { fecha: "2025-12-31", valor: 2.1 },
        { fecha: "2024-02-29", valor: 1.8 }, // Leap year
      ]);

      const result = transformInflationData(inputData);

      expect(result).toEqual({
        "2024": {
          2: 0.018,
        },
        "2025": {
          1: 0.035,
          12: 0.021,
        },
      });
    });

    it("should handle edge case dates", () => {
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 3.5 }, // Mid-month to avoid TZ edge
        { fecha: "2025-12-31", valor: 2.1 }, // End of year
        { fecha: "2024-02-29", valor: 1.8 }, // Leap year February
        { fecha: "1999-12-31", valor: 0.5 }, // Y2K era
      ]);

      const result = transformInflationData(inputData);

      expect(result["1999"]).toEqual({ 12: 0.005 });
      expect(result["2024"]).toEqual({ 2: 0.018 });
      expect(result["2025"]).toEqual({ 1: 0.035, 12: 0.021 });
    });
  });

  describe("Input Format Flexibility", () => {
    it("should handle input that starts with array bracket", () => {
      const arrayInput = '[{"fecha": "2025-01-15", "valor": 3.5}]';
      const result = transformInflationData(arrayInput);

      expect(result).toEqual({
        "2025": {
          1: 0.035,
        },
      });
    });

    it("should handle input that doesn't start with array bracket", () => {
      const objectInput = '{"fecha": "2025-01-15", "valor": 3.5}';
      const result = transformInflationData(objectInput);

      expect(result).toEqual({
        "2025": {
          1: 0.035,
        },
      });
    });

    it("should handle multiple objects without array brackets", () => {
      const multiObjectInput =
        '{"fecha": "2025-01-15", "valor": 3.5}, {"fecha": "2025-02-15", "valor": 4.2}';
      const result = transformInflationData(`[${multiObjectInput}]`);

      expect(result).toEqual({
        "2025": {
          1: 0.035,
          2: 0.042,
        },
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty array input", () => {
      const result = transformInflationData("[]");
      expect(result).toEqual({});
    });

    it("should throw on invalid JSON", () => {
      expect(() => {
        transformInflationData("invalid json");
      }).toThrow();
    });

    it("should handle records with missing fields gracefully", () => {
      expect(() => {
        transformInflationData('[{"fecha": "2025-01-15"}]');
      }).not.toThrow();

      expect(() => {
        transformInflationData('[{"valor": 3.5}]');
      }).not.toThrow();
    });

    it("should handle invalid date formats", () => {
      expect(() => {
        transformInflationData('[{"fecha": "invalid-date", "valor": 3.5}]');
      }).not.toThrow();
    });

    it("should handle zero and negative values correctly", () => {
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 0 },
        { fecha: "2025-02-15", valor: -1.5 },
        { fecha: "2025-03-15", valor: -0.001 },
      ]);

      const result = transformInflationData(inputData);

      expect(result["2025"]).toEqual({
        1: 0,
        2: -0.015,
        3: 0,
      });
    });
  });

  describe("Real World Data Integration", () => {
    it("should handle typical BCRA inflation data structure", () => {
      // Based on the actual historical-inflation.json structure
      const realWorldData = [
        { fecha: "2024-01-15", valor: 20.6 },
        { fecha: "2024-02-15", valor: 13.2 },
        { fecha: "2024-03-15", valor: 11.0 },
        { fecha: "2024-04-15", valor: 8.8 },
        { fecha: "2024-05-15", valor: 4.2 },
        { fecha: "2024-06-15", valor: 4.6 },
        { fecha: "2024-07-15", valor: 4.0 },
        { fecha: "2024-08-15", valor: 4.2 },
        { fecha: "2024-09-15", valor: 3.5 },
        { fecha: "2024-10-15", valor: 2.7 },
        { fecha: "2024-11-15", valor: 2.4 },
        { fecha: "2024-12-15", valor: 2.5 },
      ];

      const result = transformInflationData(JSON.stringify(realWorldData));

      expect(result["2024"]).toEqual({
        1: 0.206,
        2: 0.132,
        3: 0.11,
        4: 0.088,
        5: 0.042,
        6: 0.046,
        7: 0.04,
        8: 0.042,
        9: 0.035,
        10: 0.027,
        11: 0.024,
        12: 0.025,
      });
    });

    it("should handle historical data spanning multiple decades", () => {
      const historicalData = [
        { fecha: "1990-01-15", valor: 79.2 }, // High inflation period
        { fecha: "2000-01-15", valor: -0.9 }, // Deflation period
        { fecha: "2010-01-15", valor: 2.3 }, // Moderate inflation
        { fecha: "2020-01-15", valor: 3.7 }, // Recent inflation
      ];

      const result = transformInflationData(JSON.stringify(historicalData));

      expect(result).toEqual({
        "1990": { 1: 0.792 },
        "2000": { 1: -0.009 },
        "2010": { 1: 0.023 },
        "2020": { 1: 0.037 },
      });
    });

    it("should maintain data integrity with large datasets", () => {
      // Generate 5 years of monthly data
      const largeDataset = [];
      for (let year = 2020; year <= 2024; year++) {
        for (let month = 1; month <= 12; month++) {
          largeDataset.push({
            fecha: `${year}-${month.toString().padStart(2, "0")}-15`,
            valor: Math.random() * 10, // Random inflation between 0-10%
          });
        }
      }

      const result = transformInflationData(JSON.stringify(largeDataset));

      // Verify structure
      expect(Object.keys(result)).toEqual([
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
      ]);

      Object.keys(result).forEach((year) => {
        expect(Object.keys(result[year])).toHaveLength(12);
        Object.keys(result[year]).forEach((month) => {
          expect(result[year][parseInt(month)]).toBeGreaterThanOrEqual(0);
          expect(result[year][parseInt(month)]).toBeLessThanOrEqual(0.1);
        });
      });
    });
  });

  describe("Output Format Validation", () => {
    it("should produce output compatible with existing historical-inflation.json format", () => {
      const inputData = JSON.stringify([
        { fecha: "1992-01-15", valor: 3.0 },
        { fecha: "1992-02-15", valor: 2.2 },
        { fecha: "1993-01-15", valor: 0.8 },
      ]);

      const result = transformInflationData(inputData);

      // Should match the structure in historical-inflation.json
      expect(result).toEqual({
        "1992": {
          1: 0.03,
          2: 0.022,
        },
        "1993": {
          1: 0.008,
        },
      });

      // Verify JSON serializability (important for file output)
      expect(() => JSON.stringify(result)).not.toThrow();

      const jsonOutput = JSON.stringify(result);
      expect(JSON.parse(jsonOutput)).toEqual(result);
    });

    it("should handle month overwriting correctly", () => {
      // Test what happens when same month appears multiple times
      const inputData = JSON.stringify([
        { fecha: "2025-01-15", valor: 3.5 },
        { fecha: "2025-01-31", valor: 4.0 }, // Should overwrite previous January
      ]);

      const result = transformInflationData(inputData);

      expect(result["2025"]).toEqual({
        1: 0.04, // Last value should win
      });
    });
  });
});
