import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCarryTradeData,
  getCarryExitSimulation,
  getCurrentUpperLimit,
  CPI_EST,
  EST_DATE_STR,
} from "../carry-trade";
import { parseISO, differenceInDays } from "date-fns";
import { TICKER_PROSPECT } from "../constants";
import type {
  CarryTradeData,
  CarryExitData,
  MepData,
  RawBondData,
} from "@/types/carry-trade";

// Mock fetch globally for integration tests
global.fetch = vi.fn();

// Mock React cache for testing
vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as typeof import("react");
  const typedCache: <T extends (...args: unknown[]) => unknown>(fn: T) => T = (
    fn,
  ) => fn;
  return {
    ...actual,
    cache: typedCache,
  };
});

const getPayoff = (ticker: string): number => {
  const entry = TICKER_PROSPECT.find((item) => item.ticker === ticker);
  if (!entry) {
    throw new Error(`Missing ticker config for ${ticker}`);
  }
  return entry.pagoFinal;
};

describe("Carry Trade End-to-End Integration Tests", () => {
  const mockMepData: MepData[] = [
    { close: 1000 },
    { close: 1100 },
    { close: 1050 },
    { close: 1075 },
    { close: 1025 },
  ];

  const mockNotesData: RawBondData[] = [
    {
      symbol: "S30Y5",
      c: 100,
      px_bid: 99,
      px_ask: 101,
      v: 1000000,
      q_bid: 100,
      q_ask: 100,
      q_op: 50,
      pct_change: 0.5,
    },
    {
      symbol: "S16A5",
      c: 95,
      px_bid: 94,
      px_ask: 96,
      v: 500000,
      q_bid: 80,
      q_ask: 80,
      q_op: 40,
      pct_change: -0.2,
    },
  ];

  const mockBondsData: RawBondData[] = [
    {
      symbol: "T15D5",
      c: 120,
      px_bid: 119,
      px_ask: 121,
      v: 2000000,
      q_bid: 200,
      q_ask: 200,
      q_op: 100,
      pct_change: 1.2,
    },
    {
      symbol: "TTM26",
      c: 110,
      px_bid: 109,
      px_ask: 111,
      v: 1500000,
      q_bid: 150,
      q_ask: 150,
      q_op: 75,
      pct_change: 0.8,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Set a fixed date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-29"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("End-to-End Data Flow Integration", () => {
    it("should fetch and process complete carry trade data flow", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        // MEP data fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockMepData),
        } as unknown as Response)
        // Notes data fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockNotesData),
        } as unknown as Response)
        // Bonds data fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockBondsData),
        } as unknown as Response);

      const result = await getCarryTradeData();

      // Verify API integration
      expect(fetch).toHaveBeenCalledWith("https://data912.com/live/mep", {
        next: { revalidate: 3600 },
      });
      expect(fetch).toHaveBeenCalledWith("https://data912.com/live/arg_notes", {
        next: { revalidate: 3600 },
      });
      expect(fetch).toHaveBeenCalledWith("https://data912.com/live/arg_bonds", {
        next: { revalidate: 3600 },
      });

      // Verify data structure
      expect(result).toBeDefined();
      expect(result.mep).toBe(1050); // Median of [1000, 1025, 1050, 1075, 1100]
      expect(result.actualMep).toBe(1050);
      expect(result.carryData).toBeDefined();

      // Verify financial calculations integration
      const s30y5 = result.carryData.find((bond) => bond.symbol === "S30Y5");
      expect(s30y5).toBeDefined();
      expect(s30y5?.payoff).toBe(getPayoff("S30Y5")); // From ticker prospect data
      expect(s30y5?.bond_price).toBe(100);
      expect(s30y5?.expiration).toBe("2025-05-30");

      // Verify complex financial calculations
      expect(s30y5?.tna).toBeCloseTo(1.087, 2); // TNA calculation
      expect(s30y5?.tea).toBeCloseTo(1.527, 2); // TEA calculation
      expect(s30y5?.tem).toBeCloseTo(0.0792, 3); // TEM calculation

      // Verify MEP breakeven integration
      expect(s30y5?.mep_breakeven).toBeCloseTo(1431.48, 1);

      // Verify carry trade calculations at different price points
      expect(s30y5?.carry_1000).toBeCloseTo(0.431, 2);
      expect(s30y5?.carry_1100).toBeCloseTo(0.301, 2);
      expect(s30y5?.carry_1200).toBeCloseTo(0.192, 2);
    });

    it("should handle complete exit simulation integration", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockMepData),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockBondsData),
        } as unknown as Response);

      const result = await getCarryExitSimulation();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      const simulation = result[0];
      expect(simulation.symbol).toBe("T15D5");
      expect(simulation.exit_TEM).toBe(CPI_EST);
      expect(simulation.bond_price_in).toBe(120);

      // Verify date calculations integration
      const today = new Date("2025-01-29");
      const exitDate = parseISO(EST_DATE_STR);
      const expirationDate = parseISO("2025-12-15");

      const expectedDaysIn = differenceInDays(exitDate, today);
      const expectedDaysToExp = differenceInDays(expirationDate, exitDate);

      expect(Math.abs(simulation.days_in - expectedDaysIn)).toBeLessThanOrEqual(
        1,
      );
      expect(
        Math.abs(simulation.days_to_exp - expectedDaysToExp),
      ).toBeLessThanOrEqual(1);

      // Verify financial calculations integration
      const payoffT15D5 = getPayoff("T15D5");
      const expectedBondPriceOut =
        payoffT15D5 / Math.pow(1 + CPI_EST, expectedDaysToExp / 30);
      expect(simulation.bond_price_out).toBeCloseTo(expectedBondPriceOut, 2);

      const expectedDirectYield = expectedBondPriceOut / 120 - 1;
      expect(simulation.ars_direct_yield).toBeCloseTo(expectedDirectYield, 4);

      const expectedTea =
        Math.pow(1 + expectedDirectYield, 365 / expectedDaysIn) - 1;
      expect(simulation.ars_tea).toBeCloseTo(expectedTea, 2);
    });
  });

  describe("External API Integration Scenarios", () => {
    it("should handle API failures gracefully across all endpoints", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error("Network failure"));

      await expect(getCarryTradeData()).rejects.toThrow("Network failure");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch"),
        expect.any(Error),
      );
    });

    it("should handle individual API endpoint failures", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        // MEP API fails
        .mockRejectedValueOnce(new Error("MEP API down"))
        // Notes API succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockNotesData),
        } as unknown as Response)
        // Bonds API succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockBondsData),
        } as unknown as Response);

      await expect(getCarryTradeData()).rejects.toThrow("MEP API down");
    });

    it("should handle empty responses from external APIs", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        // Empty MEP data
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response)
        // Empty notes
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response)
        // Empty bonds
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response);

      const result = await getCarryTradeData();

      expect(result.mep).toBe(0);
      expect(result.carryData).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        "MEP data is empty or unavailable, returning 0.",
      );
    });

    it("should handle malformed API responses", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockNotesData),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockBondsData),
        } as unknown as Response);

      await expect(getCarryTradeData()).rejects.toThrow(
        "HTTP error! status: 500",
      );
    });
  });

  describe("Financial Calculation Integration", () => {
    it("should calculate complex financial metrics correctly across data flow", async () => {
      const complexBondData: RawBondData[] = [
        {
          symbol: "T15D5",
          c: 125.5, // More complex price
          px_bid: 124.75,
          px_ask: 126.25,
          v: 1800000,
          q_bid: 180,
          q_ask: 180,
          q_op: 90,
          pct_change: 0.95,
        },
      ];

      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([{ close: 1125.75 }]),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(complexBondData),
        } as unknown as Response);

      const result = await getCarryTradeData();

      expect(result.mep).toBe(1125.75);
      expect(result.carryData).toHaveLength(1);

      const bond = result.carryData[0];
      const payoffT15D5 = getPayoff("T15D5");

      // Verify all financial calculations are integrated correctly
      expect(bond.bond_price).toBe(125.5);
      expect(bond.payoff).toBe(payoffT15D5); // From ticker prospect data

      const today = new Date("2025-01-29");
      const expirationDate = parseISO("2025-12-15");
      const expectedDaysToExp = differenceInDays(expirationDate, today);

      expect(
        Math.abs(bond.days_to_exp - expectedDaysToExp),
      ).toBeLessThanOrEqual(1);

      // Verify complex yield calculations
      const ratio = payoffT15D5 / 125.5;
      const daysFactor = 365 / expectedDaysToExp;
      const monthlyFactor = 30 / expectedDaysToExp;

      expect(bond.tna).toBeCloseTo((ratio - 1) * daysFactor, 2);
      expect(bond.tea).toBeCloseTo(Math.pow(ratio, daysFactor) - 1, 2);
      expect(bond.tem).toBeCloseTo(Math.pow(ratio, monthlyFactor) - 1, 2);

      // Verify bid/ask calculations
      expect(bond.tem_bid).toBeCloseTo(
        Math.pow(payoffT15D5 / 124.75, monthlyFactor) - 1,
        3,
      );
      expect(bond.tem_ask).toBeCloseTo(
        Math.pow(payoffT15D5 / 126.25, monthlyFactor) - 1,
        3,
      );

      // Verify MEP breakeven
      expect(bond.mep_breakeven).toBeCloseTo(1125.75 * ratio, 2);
    });

    it("should integrate upper limit calculations with carry trade", async () => {
      // Test the integration between getCurrentUpperLimit and carry calculations
      const currentUpperLimit = getCurrentUpperLimit();
      expect(currentUpperLimit).toBeDefined();
      expect(typeof currentUpperLimit).toBe("number");

      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockMepData),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockNotesData),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockBondsData),
        } as unknown as Response);

      const result = await getCarryTradeData();

      // Verify that finish_worst calculations use the upper limit
      result.carryData.forEach((bond) => {
        expect(bond.finish_worst).toBeGreaterThan(currentUpperLimit);
        expect(bond.carry_worst).toBeCloseTo(
          ((bond.payoff / bond.bond_price) * result.mep) / bond.finish_worst -
            1,
          4,
        );
      });
    });
  });

  describe("Date and Time Integration", () => {
    it("should handle date calculations across different time scenarios", async () => {
      // Test with different system dates
      const testDates = [
        "2025-01-15", // Early in year
        "2025-04-15", // Around upper limit change
        "2025-06-30", // Mid year
        "2025-12-15", // Near year end
      ];

      for (const testDate of testDates) {
        vi.setSystemTime(new Date(testDate));

        const mockFetch = vi.mocked(fetch);
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue(mockMepData),
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue([
              {
                symbol: "T15D5",
                c: 120,
                px_bid: 119,
                px_ask: 121,
                v: 2000000,
                q_bid: 200,
                q_ask: 200,
                q_op: 100,
                pct_change: 1.2,
              },
            ]),
          } as unknown as Response);

        const result = await getCarryTradeData();

        // Verify date calculations work correctly for each scenario
        if (result.carryData.length > 0) {
          const bond = result.carryData[0];
          const today = new Date(testDate);
          const expirationDate = parseISO("2025-12-15");
          const expectedDaysToExp = differenceInDays(expirationDate, today);

          expect(
            Math.abs(bond.days_to_exp - expectedDaysToExp),
          ).toBeLessThanOrEqual(1);
          expect(bond.days_to_exp).toBeGreaterThan(0);
        }

        vi.clearAllMocks();
      }
    });

    it("should filter expired bonds correctly across date scenarios", async () => {
      // Test with a date after some bonds expire
      vi.setSystemTime(new Date("2025-06-01"));

      const expiredBondData: RawBondData[] = [
        {
          symbol: "S16A5", // Expires 2025-04-16 - should be filtered
          c: 95,
          px_bid: 94,
          px_ask: 96,
          v: 500000,
          q_bid: 80,
          q_ask: 80,
          q_op: 40,
          pct_change: -0.2,
        },
        {
          symbol: "T15D5", // Expires 2025-12-15 - should remain
          c: 120,
          px_bid: 119,
          px_ask: 121,
          v: 2000000,
          q_bid: 200,
          q_ask: 200,
          q_op: 100,
          pct_change: 1.2,
        },
      ];

      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockMepData),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(expiredBondData),
        } as unknown as Response);

      const result = await getCarryTradeData();

      expect(result.carryData).toHaveLength(1);
      expect(result.carryData[0].symbol).toBe("T15D5");
    });
  });

  describe("Performance and Caching Integration", () => {
    it("should handle concurrent requests without errors", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockMepData),
      } as unknown as Response);

      const promises = [
        getCarryTradeData(),
        getCarryTradeData(),
        getCarryExitSimulation(),
      ];
      const results = await Promise.all(promises);
      results.forEach((r) => expect(r).toBeDefined());
    });
  });
});
