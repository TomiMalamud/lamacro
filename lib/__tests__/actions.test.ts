import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVariableDataForRange } from "../actions";
import * as bcraFetch from "../bcra-fetch";

// Mock bcra-fetch module
vi.mock("../bcra-fetch");

describe("actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getVariableDataForRange", () => {
    it("should fetch variable data successfully", async () => {
      const mockResults = [
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
          valor: 3.8,
        },
      ];

      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: mockResults,
      });

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(bcraFetch.fetchVariableTimeSeries).toHaveBeenCalledWith(
        27,
        "2025-01-01",
        "2025-01-31",
      );
      expect(result).toEqual({
        data: mockResults,
        error: null,
      });
    });

    it("should handle empty results", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: [],
      });

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(result).toEqual({
        data: [],
        error: null,
      });
    });

    it("should handle missing results in response", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: null as unknown as [],
      });

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(result).toEqual({
        error: "No se encontraron resultados para el rango seleccionado.",
        data: null,
      });
      expect(console.error).toHaveBeenCalledWith(
        "No results found for variable 27 between 2025-01-01 and 2025-01-31",
      );
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockRejectedValue(
        new Error("Network timeout"),
      );

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(result).toEqual({
        error: "Error al obtener datos: Network timeout",
        data: null,
      });
      expect(console.error).toHaveBeenCalledWith(
        "Server Action error fetching time series for variable 27:",
        expect.any(Error),
      );
    });

    it("should handle non-Error thrown values", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockRejectedValue(
        "String error",
      );

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(result).toEqual({
        error: "Error al obtener datos: Error desconocido en el servidor.",
        data: null,
      });
    });

    it("should handle null response", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue(
        null as unknown as { status: number; results: [] },
      );

      const result = await getVariableDataForRange(
        27,
        "2025-01-01",
        "2025-01-31",
      );

      expect(result).toEqual({
        error: "No se encontraron resultados para el rango seleccionado.",
        data: null,
      });
    });

    it("should pass through all parameters correctly", async () => {
      vi.mocked(bcraFetch.fetchVariableTimeSeries).mockResolvedValue({
        status: 200,
        results: [],
      });

      await getVariableDataForRange(45, "2024-01-01", "2024-12-31");

      expect(bcraFetch.fetchVariableTimeSeries).toHaveBeenCalledWith(
        45,
        "2024-01-01",
        "2024-12-31",
      );
    });
  });
});
