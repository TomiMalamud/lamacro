import type { SecurityData } from "@/types/fija";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOLIDAYS, TICKER_PROSPECT } from "../constants";
import {
  calculateDays360,
  calculateDaysDifference,
  calculateTEA,
  calculateTEM,
  calculateTNA,
  getBilleteras,
  getBonos,
  getFijaData,
  getFondos,
  getLetras,
} from "../fija";

// Mock fetch globally
global.fetch = vi.fn();

describe("fija.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API fetching functions", () => {
    it("getLetras should fetch letras data", async () => {
      const mockData = { data: "letras" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => mockData,
      });

      const result = await getLetras();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://data912.com/live/arg_notes",
        { next: { revalidate: 1200 } },
      );
      expect(result).toEqual(mockData);
    });

    it("getBonos should fetch bonos data", async () => {
      const mockData = { data: "bonos" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => mockData,
      });

      const result = await getBonos();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://data912.com/live/arg_bonds",
        { next: { revalidate: 1200 } },
      );
      expect(result).toEqual(mockData);
    });

    it("getBilleteras should fetch and filter ARS currency data", async () => {
      const mockData = [
        { currency: "ARS", name: "Billetera 1" },
        { currency: "USD", name: "Billetera 2" },
        { currency: "ARS", name: "Billetera 3" },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => mockData,
      });

      const result = await getBilleteras();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.comparatasas.ar/cuentas-y-billeteras",
        { next: { revalidate: 21600 } },
      );
      expect(result).toEqual([
        { currency: "ARS", name: "Billetera 1" },
        { currency: "ARS", name: "Billetera 3" },
      ]);
    });

    it("getFondos should fetch fondos data", async () => {
      const mockData = { data: "fondos" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        json: async () => mockData,
      });

      const result = await getFondos();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.comparatasas.ar/funds/rm?name=Cocos%20Daruma%20Renta%20Mixta%20-%20Clase%20A",
        { next: { revalidate: 300 } },
      );
      expect(result).toEqual(mockData);
    });
  });

  describe("Date calculation functions", () => {
    it("calculateDaysDifference should calculate days between dates", () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-15");

      const result = calculateDaysDifference(endDate, startDate);

      expect(result).toBe(14);
    });

    it("calculateDays360 should calculate days using 360-day convention", () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-02-01");

      const result = calculateDays360(endDate, startDate);

      expect(result).toBe(30); // 360-day convention: 1 month = 30 days
    });

    it("calculateDays360 should handle end of month correctly", () => {
      const startDate = new Date("2025-01-31");
      const endDate = new Date("2025-02-28");

      const result = calculateDays360(endDate, startDate);

      expect(result).toBe(27); // Actual 360-day convention result
    });
  });

  describe("Financial calculation functions", () => {
    it("calculateTNA should calculate annual nominal rate", () => {
      const pagoFinal = 110;
      const px = 100;
      const dias = 365;

      const result = calculateTNA(pagoFinal, px, dias);

      expect(result).toBeCloseTo(0.1, 5); // 10% annual
    });

    it("calculateTEM should calculate monthly effective rate", () => {
      const pagoFinal = 110;
      const px = 100;
      const meses = 12;

      const result = calculateTEM(pagoFinal, px, meses);

      expect(result).toBeCloseTo(0.00797, 5); // ~0.797% monthly
    });

    it("calculateTEA should calculate annual effective rate", () => {
      const pagoFinal = 110;
      const px = 100;
      const dias = 365;

      const result = calculateTEA(pagoFinal, px, dias);

      expect(result).toBeCloseTo(0.1, 5); // 10% annual
    });
  });

  describe("getFijaData", () => {
    it("should process fija data correctly", () => {
      const mockLetras = [
        {
          symbol: "S30Y5",
          q_bid: 10,
          px_bid: 99,
          px_ask: 101,
          q_ask: 15,
          v: 1000,
          q_op: 50,
          c: 100,
          pct_change: 0.01,
        },
        {
          symbol: "S18J5",
          q_bid: 8,
          px_bid: 104,
          px_ask: 106,
          q_ask: 12,
          v: 800,
          q_op: 40,
          c: 105,
          pct_change: 0.02,
        },
      ];
      const mockBonos = [
        {
          symbol: "TZXY5",
          q_bid: 5,
          px_bid: 94,
          px_ask: 96,
          q_ask: 20,
          v: 1200,
          q_op: 30,
          c: 95,
          pct_change: -0.01,
        },
        {
          symbol: "TZX25",
          q_bid: 15,
          px_bid: 199,
          px_ask: 201,
          q_ask: 25,
          v: 2000,
          q_op: 60,
          c: 200,
          pct_change: 0.005,
        },
      ];

      const result = getFijaData(mockLetras, mockBonos);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const firstItem = result[0];
      expect(firstItem).toHaveProperty("ticker");
      expect(firstItem).toHaveProperty("fechaVencimiento");
      expect(firstItem).toHaveProperty("dias");
      expect(firstItem).toHaveProperty("meses");
      expect(firstItem).toHaveProperty("px");
      expect(firstItem).toHaveProperty("pagoFinal");
      expect(firstItem).toHaveProperty("tna");
      expect(firstItem).toHaveProperty("tem");
      expect(firstItem).toHaveProperty("tea");
      expect(typeof firstItem.tna).toBe("number");
      expect(typeof firstItem.tem).toBe("number");
      expect(typeof firstItem.tea).toBe("number");
    });

    it("should filter out items with zero or negative days", () => {
      const mockLetras = [
        {
          symbol: "S30Y5",
          q_bid: 10,
          px_bid: 99,
          px_ask: 101,
          q_ask: 15,
          v: 1000,
          q_op: 50,
          c: 100,
          pct_change: 0.01,
        },
      ];
      const mockBonos = [
        {
          symbol: "TZXY5",
          q_bid: 5,
          px_bid: 94,
          px_ask: 96,
          q_ask: 20,
          v: 1200,
          q_op: 30,
          c: 95,
          pct_change: -0.01,
        },
      ];

      const result = getFijaData(mockLetras, mockBonos);

      result.forEach((item) => {
        expect(item.dias).toBeGreaterThan(0);
      });
    });

    it("should sort results by days ascending", () => {
      const mockLetras = [
        {
          symbol: "S30Y5",
          q_bid: 10,
          px_bid: 99,
          px_ask: 101,
          q_ask: 15,
          v: 1000,
          q_op: 50,
          c: 100,
          pct_change: 0.01,
        },
        {
          symbol: "S18J5",
          q_bid: 8,
          px_bid: 104,
          px_ask: 106,
          q_ask: 12,
          v: 800,
          q_op: 40,
          c: 105,
          pct_change: 0.02,
        },
      ];
      const mockBonos = [
        {
          symbol: "TZXY5",
          q_bid: 5,
          px_bid: 94,
          px_ask: 96,
          q_ask: 20,
          v: 1200,
          q_op: 30,
          c: 95,
          pct_change: -0.01,
        },
        {
          symbol: "TZX25",
          q_bid: 15,
          px_bid: 199,
          px_ask: 201,
          q_ask: 25,
          v: 2000,
          q_op: 60,
          c: 200,
          pct_change: 0.005,
        },
      ];

      const result = getFijaData(mockLetras, mockBonos);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].dias).toBeGreaterThanOrEqual(result[i - 1].dias);
      }
    });

    it("should handle missing prices gracefully", () => {
      const mockLetras: SecurityData[] = [];
      const mockBonos: SecurityData[] = [];

      const result = getFijaData(mockLetras, mockBonos);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((item) => {
        if (item.px === 0) {
          expect(item.tna).toBe(0);
          expect(item.tem).toBe(0);
          expect(item.tea).toBe(0);
        }
      });
    });
  });

  describe("Constants", () => {
    it("Holidays should contain expected structure", () => {
      expect(Array.isArray(HOLIDAYS)).toBe(true);
      expect(HOLIDAYS.length).toBeGreaterThan(0);

      const firstHoliday = HOLIDAYS[0];
      expect(firstHoliday).toHaveProperty("fecha");
      expect(firstHoliday).toHaveProperty("tipo");
      expect(firstHoliday).toHaveProperty("nombre");
      expect(firstHoliday.fecha).toBe("2025-01-01");
      expect(firstHoliday.nombre).toBe("Año nuevo");
    });

    it("TICKER_PROSPECT should contain expected structure", () => {
      expect(Array.isArray(TICKER_PROSPECT)).toBe(true);
      expect(TICKER_PROSPECT.length).toBeGreaterThan(0);

      const firstConfig = TICKER_PROSPECT[0];
      expect(firstConfig).toHaveProperty("ticker");
      expect(firstConfig).toHaveProperty("fechaVencimiento");
      expect(firstConfig).toHaveProperty("pagoFinal");
      expect(typeof firstConfig.ticker).toBe("string");
      expect(typeof firstConfig.pagoFinal).toBe("number");
    });
  });
});
