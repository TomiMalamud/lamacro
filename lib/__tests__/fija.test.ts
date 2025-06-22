import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLetras,
  getBonos,
  getBilleteras,
  getFondos,
  calculateDaysDifference,
  calculateDays360,
  calculateTNA,
  calculateTEM,
  calculateTEA,
  Holidays,
  FIJA_TABLE_CONFIG,
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

  describe("Constants", () => {
    it("Holidays should contain expected structure", () => {
      expect(Array.isArray(Holidays)).toBe(true);
      expect(Holidays.length).toBeGreaterThan(0);

      const firstHoliday = Holidays[0];
      expect(firstHoliday).toHaveProperty("fecha");
      expect(firstHoliday).toHaveProperty("tipo");
      expect(firstHoliday).toHaveProperty("nombre");
      expect(firstHoliday.fecha).toBe("2025-01-01");
      expect(firstHoliday.nombre).toBe("Año nuevo");
    });

    it("FIJA_TABLE_CONFIG should contain expected structure", () => {
      expect(Array.isArray(FIJA_TABLE_CONFIG)).toBe(true);
      expect(FIJA_TABLE_CONFIG.length).toBeGreaterThan(0);

      const firstConfig = FIJA_TABLE_CONFIG[0];
      expect(firstConfig).toHaveProperty("ticker");
      expect(firstConfig).toHaveProperty("fechaVencimiento");
      expect(firstConfig).toHaveProperty("pagoFinal");
      expect(typeof firstConfig.ticker).toBe("string");
      expect(typeof firstConfig.pagoFinal).toBe("number");
    });
  });
});
