import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateAccumulatedInflation,
  getAcciones,
  getAccionesWithYTD,
  calculateYTDReturns,
  panelLiderYTDBaseline,
} from "../acciones";
import * as bcraFetch from "../bcra-fetch";

// Mock dependencies
vi.mock("../bcra-fetch");
global.fetch = vi.fn();

describe("acciones.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-29"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateAccumulatedInflation", () => {
    it("should calculate accumulated inflation correctly", async () => {
      const mockInflationData = {
        status: 200,
        results: [
          {
            idVariable: 27,
            descripcion: "IPC Nacional",
            categoria: "Inflación",
            fecha: "2025-01-01",
            valor: 3.5,
          },
          {
            idVariable: 27,
            descripcion: "IPC Nacional",
            categoria: "Inflación",
            fecha: "2025-01-15",
            valor: 2.8,
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockInflationData,
      );

      const result = await calculateAccumulatedInflation();

      expect(bcraFetch.fetchVariableTimeSeries).toHaveBeenCalledWith(
        27,
        "2025-01-01",
        "2025-01-29",
      );

      // (1 + 0.035) * (1 + 0.028) - 1 = 0.06398 = 6.4%
      expect(result).toBe(6.4);
    });

    it("should return 0 when no results", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: [],
      });

      const result = await calculateAccumulatedInflation();
      expect(result).toBe(0);
    });

    it("should handle API errors", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockRejectedValue(
        new Error("API Error"),
      );

      const result = await calculateAccumulatedInflation();

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching inflation data:",
        expect.any(Error),
      );
    });

    it("should handle null results", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: null as unknown as [],
      });

      const result = await calculateAccumulatedInflation();
      expect(result).toBe(0);
    });
  });

  describe("getAcciones", () => {
    it("should fetch stock data successfully", async () => {
      const mockStockData = [
        {
          symbol: "GGAL",
          c: 8500,
          px_bid: 8490,
          px_ask: 8510,
          q_bid: 100,
          q_ask: 100,
          v: 1000000,
          q_op: 50,
          pct_change: 2.5,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStockData,
      });

      const result = await getAcciones();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://data912.com/live/arg_stocks",
        { next: { revalidate: 1200 } },
      );
      expect(result).toEqual(mockStockData);
    });

    it("should handle fetch errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await getAcciones();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching acciones:",
        expect.any(Error),
      );
    });
  });

  describe("calculateYTDReturns", () => {
    it("should calculate YTD returns for panel lider stocks", () => {
      const currentPrices = [
        {
          symbol: "GGAL",
          c: 9000,
          px_bid: 8990,
          px_ask: 9010,
          q_bid: 100,
          q_ask: 100,
          v: 1000000,
          q_op: 50,
          pct_change: 1.5,
        },
        {
          symbol: "UNKNOWN",
          c: 1000,
          px_bid: 990,
          px_ask: 1010,
          q_bid: 50,
          q_ask: 50,
          v: 500000,
          q_op: 25,
          pct_change: 0.5,
        },
      ];

      const result = calculateYTDReturns(currentPrices);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("GGAL");
      expect(result[0].name).toBe("Grupo Galicia");

      // (9000 - 8070) / 8070 * 100 = 11.52%
      expect(result[0].ytdReturn).toBe(11.52);
    });

    it("should filter out stocks not in panel lider", () => {
      const currentPrices = [
        {
          symbol: "UNKNOWN1",
          c: 1000,
          px_bid: 990,
          px_ask: 1010,
          q_bid: 50,
          q_ask: 50,
          v: 500000,
          q_op: 25,
          pct_change: 0.5,
        },
        {
          symbol: "UNKNOWN2",
          c: 2000,
          px_bid: 1990,
          px_ask: 2010,
          q_bid: 50,
          q_ask: 50,
          v: 500000,
          q_op: 25,
          pct_change: 0.5,
        },
      ];

      const result = calculateYTDReturns(currentPrices);
      expect(result).toEqual([]);
    });

    it("should handle negative YTD returns", () => {
      const currentPrices = [
        {
          symbol: "YPFD",
          c: 45000,
          px_bid: 44900,
          px_ask: 45100,
          q_bid: 100,
          q_ask: 100,
          v: 2000000,
          q_op: 100,
          pct_change: -2.0,
        },
      ];

      const result = calculateYTDReturns(currentPrices);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe("YPFD");
      expect(result[0].name).toBe("YPF");

      // (45000 - 52400) / 52400 * 100 = -14.12%
      expect(result[0].ytdReturn).toBe(-14.12);
    });

    it("should handle empty array", () => {
      const result = calculateYTDReturns([]);
      expect(result).toEqual([]);
    });
  });

  describe("getAccionesWithYTD", () => {
    it("should fetch and calculate YTD returns", async () => {
      const mockStockData = [
        {
          symbol: "GGAL",
          c: 9000,
          px_bid: 8990,
          px_ask: 9010,
          q_bid: 100,
          q_ask: 100,
          v: 1000000,
          q_op: 50,
          pct_change: 1.5,
        },
        {
          symbol: "YPFD",
          c: 54000,
          px_bid: 53900,
          px_ask: 54100,
          q_bid: 200,
          q_ask: 200,
          v: 3000000,
          q_op: 150,
          pct_change: 0.8,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStockData,
      });

      const result = await getAccionesWithYTD();

      expect(result).toHaveLength(2);
      expect(result[0].ytdReturn).toBeDefined();
      expect(result[1].ytdReturn).toBeDefined();
    });

    it("should handle errors and return empty array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await getAccionesWithYTD();

      expect(result).toEqual([]);
    });
  });

  describe("panelLiderYTDBaseline", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(panelLiderYTDBaseline)).toBe(true);
      expect(panelLiderYTDBaseline.length).toBe(21);

      panelLiderYTDBaseline.forEach((stock) => {
        expect(stock).toHaveProperty("symbol");
        expect(stock).toHaveProperty("name");
        expect(stock).toHaveProperty("value");
        expect(typeof stock.symbol).toBe("string");
        expect(typeof stock.name).toBe("string");
        expect(typeof stock.value).toBe("number");
      });
    });

    it("should contain specific stocks", () => {
      const symbols = panelLiderYTDBaseline.map((s) => s.symbol);
      expect(symbols).toContain("GGAL");
      expect(symbols).toContain("YPFD");
      expect(symbols).toContain("PAMP");
      expect(symbols).toContain("BMA");
    });
  });
});
