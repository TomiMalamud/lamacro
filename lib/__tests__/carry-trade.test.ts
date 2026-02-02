import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCarryTradeData,
  getCarryExitSimulation,
  CPI_EST,
  EST_DATE_STR,
} from "../carry-trade";
import { parseISO } from "date-fns";
import { TICKER_PROSPECT } from "../constants";

global.fetch = vi.fn();

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

describe("carry-trade.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-29"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCarryTradeData", () => {
    it("should fetch and process carry trade data successfully", async () => {
      const mockMepData = [{ close: 1000 }, { close: 1100 }, { close: 1050 }];

      const mockBondData = [
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
      ];

      // Mock MEP fetch
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMepData,
        })
        // Mock notes fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockBondData[0]],
        })
        // Mock bonds fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockBondData[1]],
        });

      const result = await getCarryTradeData();

      expect(result).toBeDefined();
      expect(result.mep).toBe(1050); // Median of [1000, 1050, 1100]
      expect(result.carryData).toHaveLength(2);

      const s30y5 = result.carryData.find((b) => b.symbol === "S30Y5");
      expect(s30y5).toBeDefined();
      expect(s30y5?.bond_price).toBe(100);
      expect(s30y5?.payoff).toBe(getPayoff("S30Y5"));
      expect(s30y5?.expiration).toBe("2025-05-30");
      expect(s30y5?.days_to_exp).toBeGreaterThan(0);
      expect(s30y5?.tem).toBeCloseTo(0.0792, 3);
      expect(s30y5?.tea).toBeCloseTo(1.527, 2);
      expect(s30y5?.tna).toBeCloseTo(1.087, 2);
      expect(s30y5?.mep_breakeven).toBeCloseTo(1431.48, 1);

      // Check carry calculations
      expect(s30y5?.carry_1000).toBeCloseTo(0.431, 2);
      expect(s30y5?.carry_1100).toBeCloseTo(0.301, 2);
      expect(s30y5?.carry_1200).toBeCloseTo(0.192, 2);
    });

    it("should handle empty MEP data", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await getCarryTradeData();

      expect(result.mep).toBe(0);
      expect(result.carryData).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        "MEP data is empty or unavailable, returning 0.",
      );
    });

    it("should filter out expired bonds", async () => {
      const mockMepData = [{ close: 1000 }];
      const mockBondData = [
        {
          symbol: "S16A5", // Expired bond (2025-04-16 < current date)
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
          symbol: "T15D5", // Valid future bond
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

      // Set time to after S16A5 expiration
      vi.setSystemTime(new Date("2025-04-20"));

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMepData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBondData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await getCarryTradeData();

      expect(result.carryData).toHaveLength(1);
      expect(result.carryData[0].symbol).toBe("T15D5");
    });

    it("should handle fetch errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(getCarryTradeData()).rejects.toThrow("Network error");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getCarryExitSimulation", () => {
    it("should calculate carry exit simulation correctly", async () => {
      const mockMepData = [{ close: 1000 }];
      const mockBondData = [
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
      ];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMepData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBondData,
        });

      const result = await getCarryExitSimulation();

      expect(result).toHaveLength(1);

      const simulation = result[0];
      expect(simulation.symbol).toBe("T15D5");
      expect(simulation.payoff).toBe(getPayoff("T15D5"));
      expect(simulation.expiration).toBe("2025-12-15");
      expect(simulation.bond_price_in).toBe(120);
      expect(simulation.exit_TEM).toBe(CPI_EST);

      // Check calculations
      const exitDate = parseISO(EST_DATE_STR);
      const today = new Date("2025-01-29");
      const expirationDate = parseISO("2025-12-15");

      const expectedDaysIn = Math.ceil(
        (exitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const expectedDaysToExp = Math.ceil(
        (expirationDate.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(simulation.days_in).toBe(expectedDaysIn);
      expect(simulation.days_to_exp).toBe(expectedDaysToExp);

      // Check bond price out calculation
      const payoff = getPayoff("T15D5");
      const expectedBondPriceOut =
        payoff / Math.pow(1 + CPI_EST, expectedDaysToExp / 30);
      expect(simulation.bond_price_out).toBeCloseTo(expectedBondPriceOut, 2);

      // Check yield calculations
      const expectedDirectYield = expectedBondPriceOut / 120 - 1;
      expect(simulation.ars_direct_yield).toBeCloseTo(expectedDirectYield, 4);

      const expectedTea =
        Math.pow(1 + expectedDirectYield, 365 / expectedDaysIn) - 1;
      expect(simulation.ars_tea).toBeCloseTo(expectedTea, 4);
    });

    it("should filter out bonds that expire before exit date", async () => {
      const mockMepData = [{ close: 1000 }];
      const mockBondData = [
        {
          symbol: "S30Y5", // Expires 2025-05-30, before EST_DATE_STR
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
          symbol: "T15D5", // Expires 2025-12-15, after EST_DATE_STR
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

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMepData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBondData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await getCarryExitSimulation();

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("T15D5");
    });

    it("should handle empty carry data", async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await getCarryExitSimulation();

      expect(result).toEqual([]);
    });
  });

  describe("Constants", () => {
    it("should have correct CPI_EST value", () => {
      expect(CPI_EST).toBe(0.01);
    });

    it("should have correct EST_DATE_STR value", () => {
      expect(EST_DATE_STR).toBe("2025-10-15");
    });
  });
});
