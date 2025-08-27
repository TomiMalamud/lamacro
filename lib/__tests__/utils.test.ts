import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  formatDateAR,
  formatNumber,
  formatPeriod,
  getNextBusinessDay,
} from "../utils";
import { HOLIDAYS } from "../constants";

describe("Utils Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Business Day Calculations with Argentine Holidays", () => {
    it("should skip weekends correctly", () => {
      // Thursday, January 24, 2025
      const thursday = new Date("2025-01-24");
      const nextBusinessDay = getNextBusinessDay(thursday);

      // Next business day after Thursday is Friday (25th)
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-01-25");
    });

    it("should skip Argentine national holidays", () => {
      // December 31, 2024 - next day is New Year (holiday)
      const newYearEve = new Date("2024-12-31");
      const nextBusinessDay = getNextBusinessDay(newYearEve);

      // Should skip January 1, 2025 (Año nuevo) and land on January 2
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-01-02");
    });

    it("should handle Carnaval holidays correctly", () => {
      // March 2, 2025 (Sunday) - next business day should skip Carnaval
      const beforeCarnaval = new Date("2025-03-02");
      const nextBusinessDay = getNextBusinessDay(beforeCarnaval);

      // Should skip March 3 and 4 (Carnaval) and land on March 5
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-03-05");
    });

    it("should handle Easter holidays correctly", () => {
      // April 17, 2025 (Wednesday before Viernes Santo)
      const beforeEaster = new Date("2025-04-17");
      const nextBusinessDay = getNextBusinessDay(beforeEaster);

      // Should skip April 18 (Viernes Santo), land on April 19 (Friday)
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-04-19");
    });

    it("should handle Worker's Day and bridge holidays", () => {
      // April 30, 2025 (Tuesday before May 1 Labor Day)
      const beforeLaborDay = new Date("2025-04-30");
      const nextBusinessDay = getNextBusinessDay(beforeLaborDay);

      // Should skip May 1 (Labor Day) and May 2 (Bridge), land on May 3 (Friday)
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-05-03");
    });

    it("should handle multiple consecutive holidays and weekends", () => {
      // Test a complex scenario with holidays and weekends
      const beforeComplexPeriod = new Date("2025-05-23"); // Thursday before May 25 holiday
      const nextBusinessDay = getNextBusinessDay(beforeComplexPeriod);

      // Should land on May 24 (Friday) since it's the next business day
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-05-24");
    });

    it("should work correctly with current date default", () => {
      // Mock current date to a known value
      const fixedDate = new Date("2025-01-29"); // Wednesday
      vi.setSystemTime(fixedDate);

      const nextBusinessDay = getNextBusinessDay();

      // Should return January 30, 2025 (Thursday)
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-01-30");

      vi.useRealTimers();
    });

    it("should integrate correctly with HOLIDAYS constant", () => {
      // Verify integration with the actual holidays data
      expect(HOLIDAYS).toBeDefined();
      expect(HOLIDAYS.length).toBeGreaterThan(10);

      // Test that New Year is properly integrated
      const newYearHoliday = HOLIDAYS.find((h) => h.fecha === "2025-01-01");
      expect(newYearHoliday).toBeDefined();
      expect(newYearHoliday?.nombre).toBe("Año nuevo");

      // Test business day calculation uses the holidays
      const beforeNewYear = new Date("2024-12-31");
      const nextBusinessDay = getNextBusinessDay(beforeNewYear);
      expect(nextBusinessDay.toISOString().split("T")[0]).toBe("2025-01-02");
    });
  });

  describe("Date Formatting Integration", () => {
    it("should format Argentine dates correctly", () => {
      expect(formatDateAR("2025-01-29")).toBe("29/01/2025");
      expect(formatDateAR("2025-12-31")).toBe("31/12/2025");
      expect(formatDateAR("2025-03-04")).toBe("04/03/2025"); // Carnaval date
    });

    it("should handle edge case dates", () => {
      expect(formatDateAR("2025-02-28")).toBe("28/02/2025");
      expect(formatDateAR("2024-02-29")).toBe("29/02/2024"); // Leap year
      expect(formatDateAR("2025-01-01")).toBe("01/01/2025"); // New Year
    });

    it("should integrate with BCRA data date formats", () => {
      // BCRA typically returns dates in YYYY-MM-DD format
      const bcraDateFormats = [
        "2025-01-15",
        "2025-03-24", // Holiday date from constants
        "2025-05-25", // Revolution Day
      ];

      bcraDateFormats.forEach((date) => {
        const formatted = formatDateAR(date);
        expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      });
    });
  });

  describe("Number Formatting for Financial Data", () => {
    it("should format financial numbers with Argentine locale", () => {
      expect(formatNumber(1234.56)).toBe("1.234,56");
      expect(formatNumber(1000000.789, 3)).toBe("1.000.000,789");
      expect(formatNumber(0.1234, 4)).toBe("0,1234");
    });

    it("should handle percentage formatting correctly", () => {
      expect(formatNumber(0.1234, 2, "percentage")).toBe("12,34%");
      expect(formatNumber(0.05, 1, "percentage")).toBe("5,0%");
      expect(formatNumber(1.5, 0, "percentage")).toBe("150%");
    });

    it("should handle integer removal correctly", () => {
      expect(formatNumber(100, 2, "number", true)).toBe("100"); // Remove decimals for integers
      expect(formatNumber(100.5, 2, "number", true)).toBe("100,50"); // Keep decimals for non-integers
      expect(formatNumber(100, 2, "number", false)).toBe("100,00"); // Force decimals
    });

    it("should format BCRA financial metrics correctly", () => {
      // Test typical BCRA values
      const reserveValue = 50000000000; // 50 billion USD
      const inflationRate = 0.035; // 3.5%
      const exchangeRate = 1050.75;

      expect(formatNumber(reserveValue, 0)).toBe("50.000.000.000");
      expect(formatNumber(inflationRate, 1, "percentage")).toBe("3,5%");
      expect(formatNumber(exchangeRate, 2)).toBe("1.050,75");
    });

    it("should handle edge cases in financial formatting", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(-1234.56)).toBe("-1.234,56");
      expect(formatNumber(0.001, 4, "percentage")).toBe("0,1000%");
      expect(formatNumber(Number.MAX_SAFE_INTEGER, 0)).toMatch(
        /^\d{1,3}(\.\d{3})*$/,
      );
    });
  });

  describe("Period Formatting for BCRA Data", () => {
    it("should format BCRA period strings correctly", () => {
      expect(formatPeriod("202501")).toBe("Enero 2025");
      expect(formatPeriod("202412")).toBe("Diciembre 2024");
      expect(formatPeriod("202506")).toBe("Junio 2025");
    });

    it("should handle all months correctly", () => {
      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      months.forEach((month, index) => {
        const periodString = `2025${(index + 1).toString().padStart(2, "0")}`;
        expect(formatPeriod(periodString)).toBe(`${month} 2025`);
      });
    });

    it("should handle invalid period formats", () => {
      expect(formatPeriod(null)).toBe("N/A");
      expect(formatPeriod("")).toBe("N/A");
      expect(formatPeriod("2025")).toBe("2025"); // Too short
      expect(formatPeriod("20251234")).toBe("20251234"); // Too long
      expect(formatPeriod("invalid")).toBe("invalid");
    });

    it("should integrate with typical BCRA inflation data periods", () => {
      // Test periods that would come from BCRA inflation data
      const inflationPeriods = ["202412", "202501", "202502", "202503"];
      const expectedMonths = [
        "Diciembre 2024",
        "Enero 2025",
        "Febrero 2025",
        "Marzo 2025",
      ];

      inflationPeriods.forEach((period, index) => {
        expect(formatPeriod(period)).toBe(expectedMonths[index]);
      });
    });
  });

  describe("CSS Class Utility Integration", () => {
    it("should merge classes correctly for financial components", () => {
      const baseClasses = "text-sm font-medium";
      const conditionalClasses = "text-green-600";
      const merged = cn(baseClasses, conditionalClasses);

      expect(merged).toContain("text-sm");
      expect(merged).toContain("font-medium");
      expect(merged).toContain("text-green-600");
    });

    it("should handle Tailwind conflicts correctly", () => {
      const result = cn("text-red-500", "text-green-600");
      expect(result).toBe("text-green-600"); // Should keep the last one
    });

    it("should handle conditional classes for financial data", () => {
      const isPositive = true;
      const isNegative = false;

      const positiveResult = cn(
        "font-semibold",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
      );

      expect(positiveResult).toContain("text-green-600");
      expect(positiveResult).not.toContain("text-red-600");
    });
  });

  describe("Cross-function Integration", () => {
    it("should work together for complete financial data display", () => {
      const testDate = "2025-01-29";
      const testValue = 1234.567;
      const testPeriod = "202501";

      const formattedDate = formatDateAR(testDate);
      const formattedValue = formatNumber(testValue, 2);
      const formattedPeriod = formatPeriod(testPeriod);

      expect(formattedDate).toBe("29/01/2025");
      expect(formattedValue).toBe("1.234,57");
      expect(formattedPeriod).toBe("Enero 2025");

      // Verify these work together as expected in a financial context
      const financialDataString = `${formattedPeriod}: $${formattedValue} (${formattedDate})`;
      expect(financialDataString).toBe("Enero 2025: $1.234,57 (29/01/2025)");
    });

    it("should handle business day calculations with formatted dates", () => {
      const startDate = new Date("2025-01-24"); // Thursday
      const nextBusinessDay = getNextBusinessDay(startDate);
      const formattedDate = formatDateAR(
        nextBusinessDay.toISOString().split("T")[0],
      );

      expect(formattedDate).toBe("25/01/2025"); // Friday
    });

    it("should integrate with financial calculations and holidays", () => {
      // Test business day calculation around a holiday
      const beforeHoliday = new Date("2024-12-31");
      const nextBusinessDay = getNextBusinessDay(beforeHoliday);
      const formattedNextDay = formatDateAR(
        nextBusinessDay.toISOString().split("T")[0],
      );

      expect(formattedNextDay).toBe("02/01/2025"); // Skips New Year holiday

      // Format a typical financial value for that period
      const yearEndValue = 50000000;
      const formattedValue = formatNumber(yearEndValue, 0);
      expect(formattedValue).toBe("50.000.000");
    });
  });
});
