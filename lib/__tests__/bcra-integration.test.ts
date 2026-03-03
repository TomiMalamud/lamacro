import { describe, it, expect, vi, beforeEach } from "vitest";

async function loadBcraModules() {
  const bcraFetch = await import("../bcra-fetch");
  const bcraApiHelper = await import("../bcra-api-helper");
  return { bcraFetch, bcraApiHelper };
}

describe("BCRA API integration flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("normalizes v4 direct response shape", async () => {
    const { bcraFetch, bcraApiHelper } = await loadBcraModules();
    const spy = vi.spyOn(bcraApiHelper, "makeBCRADataRequest");
    spy.mockResolvedValueOnce({
      status: 200,
      results: [
        {
          idVariable: 1,
          descripcion: "Reservas Internacionales",
          categoria: "Divisas",
          ultFechaInformada: "2026-02-26",
          ultValorInformado: 46158,
        },
      ],
    });

    const result = await bcraFetch.fetchBCRADirect();

    expect(result).toEqual({
      status: 200,
      results: [
        {
          idVariable: 1,
          descripcion: "Reservas Internacionales",
          categoria: "Divisas",
          fecha: "2026-02-26",
          valor: 46158,
        },
      ],
    });
  });

  it("normalizes v4 time-series detail response", async () => {
    const { bcraFetch, bcraApiHelper } = await loadBcraModules();
    const spy = vi.spyOn(bcraApiHelper, "makeBCRADataRequest");
    spy.mockResolvedValueOnce({
      status: 200,
      results: [
        {
          idVariable: 27,
          detalle: [
            { fecha: "2025-03-31", valor: 3.7 },
            { fecha: "2025-04-30", valor: 2.8 },
          ],
        },
      ],
    });

    const result = await bcraFetch.fetchVariableTimeSeries(27, "2025-03-01");

    expect(result).toEqual({
      status: 200,
      results: [
        {
          idVariable: 27,
          descripcion: "Variable #27",
          categoria: "Sin categoría",
          fecha: "2025-03-31",
          valor: 3.7,
        },
        {
          idVariable: 27,
          descripcion: "Variable #27",
          categoria: "Sin categoría",
          fecha: "2025-04-30",
          valor: 2.8,
        },
      ],
    });
  });

  it("propagates API errors for direct fetch (no Redis fallback)", async () => {
    const { bcraFetch, bcraApiHelper } = await loadBcraModules();
    const spy = vi.spyOn(bcraApiHelper, "makeBCRADataRequest");
    spy.mockRejectedValueOnce(new Error("Network failure"));

    await expect(bcraFetch.fetchBCRADirect()).rejects.toThrow(
      "Network failure",
    );
  });

  it("builds request options with v4 endpoints", async () => {
    const { bcraApiHelper } = await loadBcraModules();

    const directOptions = bcraApiHelper.createBCRARequestOptions(
      "/estadisticas/v4.0/monetarias",
    );
    const seriesOptions = bcraApiHelper.createBCRARequestOptions(
      "/estadisticas/v4.0/monetarias/27?desde=2025-03-01",
    );

    expect(directOptions.hostname).toBe("api.bcra.gob.ar");
    expect(directOptions.path).toBe("/estadisticas/v4.0/monetarias");
    expect(seriesOptions.path).toBe(
      "/estadisticas/v4.0/monetarias/27?desde=2025-03-01",
    );
    expect(directOptions.timeout).toBe(10000);
  });
});
