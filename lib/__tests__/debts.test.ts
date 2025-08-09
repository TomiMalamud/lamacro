import { beforeEach, describe, expect, it, vi } from "vitest";
import * as bcraApiHelper from "../bcra-api-helper";
import { fetchCheques, fetchDeudas, fetchHistorial } from "../debts";

// Mock bcra-api-helper
vi.mock("../bcra-api-helper");

describe("debts.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("fetchDeudas", () => {
    it("should fetch debt data successfully", async () => {
      const mockDeudaData = {
        status: 200,
        results: {
          identificacion: 12345678,
          denominacion: "Juan Perez",
          periodos: [
            {
              periodo: "2025-01",
              entidades: [
                {
                  entidad: "Banco Test",
                  situacion: 1,
                  fechaSit1: "2025-01-15",
                  monto: 50000,
                  diasAtrasoPago: 0,
                  refinanciaciones: false,
                  recategorizacionOblig: false,
                  situacionJuridica: false,
                  irrecDisposicionTecnica: false,
                  enRevision: false,
                  procesoJud: false,
                },
              ],
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockDeudaData),
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchDeudas("12345678");

      expect(bcraApiHelper.makeBCRARequest).toHaveBeenCalledWith(
        "/centraldedeudores/v1.0/Deudas/12345678",
      );
      expect(result).toEqual(mockDeudaData);
    });

    it("should return null for 404 response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchDeudas("99999999");

      expect(result).toBeNull();
    });

    it("should throw error for other error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchDeudas("12345678");

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      vi.mocked(bcraApiHelper.makeBCRARequest).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await fetchDeudas("12345678");

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching debt data:",
        expect.any(Error),
      );
    });
  });

  describe("fetchHistorial", () => {
    it("should fetch historical data successfully", async () => {
      const mockHistorialData = {
        status: 200,
        results: {
          identificacion: 12345678,
          denominacion: "Juan Perez",
          periodos: [
            {
              periodo: "2024-12",
              entidades: [
                {
                  entidad: "Banco Test",
                  situacion: 1,
                  monto: 45000,
                  enRevision: false,
                  procesoJud: false,
                },
              ],
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockHistorialData),
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchHistorial("12345678");

      expect(bcraApiHelper.makeBCRARequest).toHaveBeenCalledWith(
        "/centraldedeudores/v1.0/Deudas/Historicas/12345678",
      );
      expect(result).toEqual(mockHistorialData);
    });

    it("should return null for 404 response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchHistorial("99999999");

      expect(result).toBeNull();
    });

    it("should handle errors", async () => {
      vi.mocked(bcraApiHelper.makeBCRARequest).mockRejectedValue(
        new Error("API error"),
      );

      const result = await fetchHistorial("12345678");

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching historical data:",
        expect.any(Error),
      );
    });
  });

  describe("fetchCheques", () => {
    it("should fetch check data successfully", async () => {
      const mockChequeData = {
        status: 200,
        results: {
          identificacion: 12345678,
          denominacion: "Juan Perez",
          causales: [
            {
              causal: "Sin fondos",
              entidades: [
                {
                  entidad: 123,
                  detalle: [
                    {
                      nroCheque: 1001,
                      fechaRechazo: "2025-01-10",
                      monto: 10000,
                      fechaPago: null,
                      fechaPagoMulta: null,
                      estadoMulta: null,
                      ctaPersonal: true,
                      denomJuridica: null,
                      enRevision: false,
                      procesoJud: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockChequeData),
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchCheques("12345678");

      expect(bcraApiHelper.makeBCRARequest).toHaveBeenCalledWith(
        "/centraldedeudores/v1.0/Deudas/Historicas/12345678",
      );
      expect(result).toEqual(mockChequeData);
    });

    it("should return null for 404 response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      vi.mocked(bcraApiHelper.makeBCRARequest).mockResolvedValue(
        mockResponse as unknown as Response,
      );

      const result = await fetchCheques("99999999");

      expect(result).toBeNull();
    });

    it("should handle errors", async () => {
      vi.mocked(bcraApiHelper.makeBCRARequest).mockRejectedValue(
        new Error("API error"),
      );

      const result = await fetchCheques("12345678");

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching check data:",
        expect.any(Error),
      );
    });
  });
});
