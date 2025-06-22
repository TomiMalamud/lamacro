import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDualBondSimulationData, DUAL_BOND_EVENTS } from "../duales";
import * as bcraFetch from "../bcra-fetch";

// Mock bcra-fetch
vi.mock("../bcra-fetch");

describe("duales.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-29"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDualBondSimulationData", () => {
    it("should fetch and process dual bond simulation data", async () => {
      const mockTamarData = {
        status: 200,
        results: [
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-16",
            valor: 18.5,
          },
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-17",
            valor: 18.8,
          },
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-20",
            valor: 19.0,
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockTamarData,
      );

      const result = await getDualBondSimulationData();

      expect(result).not.toBeNull();
      expect(result?.chartData).toBeDefined();
      expect(result?.tableDataTemDiff).toBeDefined();
      expect(result?.tableDataPayoffDiff).toBeDefined();
      expect(result?.eventDates).toEqual(DUAL_BOND_EVENTS);

      // Check chart data has expected structure
      const chartPoint = result?.chartData[0];
      expect(chartPoint).toHaveProperty("date");
      expect(chartPoint).toHaveProperty("tamar_tem_spot");

      // Check table data
      expect(result?.tableDataTemDiff.length).toBeGreaterThan(0);
      expect(result?.tableDataPayoffDiff.length).toBeGreaterThan(0);

      // Verify last row is meses
      const lastRowTem =
        result?.tableDataTemDiff[result.tableDataTemDiff.length - 1];
      expect(lastRowTem?.label).toBe("Meses de payoff");
    });

    it("should return null when no TAMAR data available", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: [],
      });

      const result = await getDualBondSimulationData();
      expect(result).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockRejectedValue(
        new Error("API Error"),
      );

      const result = await getDualBondSimulationData();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch TAMAR rate for variableID 45 using fetchVariableTimeSeries:",
        expect.any(Error),
      );
    });

    it("should calculate TEM spot correctly from TEA", async () => {
      const mockTamarData = {
        status: 200,
        results: [
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-16",
            valor: 20.0, // 20% TEA
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockTamarData,
      );

      const result = await getDualBondSimulationData();

      // TEA = 20% => TEM = (1.20)^(1/12) - 1 ≈ 1.53%
      const chartData = result?.chartData.find((d) => d.date === "2025-01-16");
      expect(chartData?.tamar_tem_spot).toBeCloseTo(0.0153, 3);
    });

    it("should generate projection scenarios", async () => {
      const mockTamarData = {
        status: 200,
        results: [
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-28",
            valor: 18.5,
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockTamarData,
      );

      const result = await getDualBondSimulationData();

      // Check projection columns exist
      const futurePoint = result?.chartData.find((d) => d.date > "2025-01-28");
      expect(futurePoint).toBeDefined();

      // Should have projection scenarios
      expect(futurePoint).toHaveProperty("tamar_proy_1.3");
      expect(futurePoint).toHaveProperty("tamar_proy_1.5");
      expect(futurePoint).toHaveProperty("tamar_proy_1.8");
    });

    it("should calculate fixed rates for bonds", async () => {
      const mockTamarData = {
        status: 200,
        results: [
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-16",
            valor: 18.5,
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockTamarData,
      );

      const result = await getDualBondSimulationData();

      // Check fixed rates are set for dates on or before bond events
      const pointOnOrBeforeEvent = result?.chartData.find(
        (d) =>
          d.TTM26_fixed_rate !== undefined || d.TTJ26_fixed_rate !== undefined,
      );
      expect(pointOnOrBeforeEvent).toBeDefined();
      if (pointOnOrBeforeEvent?.TTM26_fixed_rate !== undefined) {
        expect(pointOnOrBeforeEvent.TTM26_fixed_rate).toBe(0.0225);
      }
      if (pointOnOrBeforeEvent?.TTJ26_fixed_rate !== undefined) {
        expect(pointOnOrBeforeEvent.TTJ26_fixed_rate).toBe(0.0219);
      }
    });

    it("should handle event dates correctly", async () => {
      const mockTamarData = {
        status: 200,
        results: [
          {
            idVariable: 45,
            descripcion: "TAMAR",
            categoria: "Tasa",
            fecha: "2025-01-16",
            valor: 18.5,
          },
        ],
      };

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        mockTamarData,
      );

      const result = await getDualBondSimulationData();

      expect(result?.eventDates).toEqual({
        TTM26: "2026-03-16",
        TTJ26: "2026-06-30",
        TTS26: "2026-09-15",
        TTD26: "2026-12-15",
      });
    });
  });

  describe("DUAL_BOND_EVENTS constant", () => {
    it("should have correct bond event dates", () => {
      expect(DUAL_BOND_EVENTS).toEqual({
        TTM26: "2026-03-16",
        TTJ26: "2026-06-30",
        TTS26: "2026-09-15",
        TTD26: "2026-12-15",
      });
    });
  });
});
