import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getHydratedTickerProspectUncached,
  mergeTickerProspects,
  parseTickerProspectCsv,
} from "../ticker-prospect";
import { TICKER_PROSPECT } from "../constants";

const originalAllowSheetFetch = process.env.ALLOW_TICKER_SHEET_FETCH;

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

describe("ticker-prospect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalAllowSheetFetch === undefined) {
      delete process.env.ALLOW_TICKER_SHEET_FETCH;
    } else {
      process.env.ALLOW_TICKER_SHEET_FETCH = originalAllowSheetFetch;
    }
  });

  it("parses ticker rows from sheet csv", () => {
    const csv = [
      "Ticker,Fecha Vencim.,Pago",
      "T30J6,30/06/2026,144.90",
      "NEW1,01/07/2026,120.50",
    ].join("\n");

    const parsed = parseTickerProspectCsv(csv);

    expect(parsed).toEqual([
      {
        ticker: "T30J6",
        fechaVencimiento: "2026-06-30",
        pagoFinal: 144.9,
      },
      {
        ticker: "NEW1",
        fechaVencimiento: "2026-07-01",
        pagoFinal: 120.5,
      },
    ]);
  });

  it("merges remote data over base and appends new tickers", () => {
    const base = [
      {
        ticker: "T30J6",
        fechaVencimiento: "2026-06-30",
        pagoFinal: 144.9,
      },
      {
        ticker: "T31Y7",
        fechaVencimiento: "2027-05-31",
        pagoFinal: 151.56,
      },
    ];
    const remote = [
      {
        ticker: "T30J6",
        fechaVencimiento: "2026-06-30",
        pagoFinal: 150,
      },
      {
        ticker: "NEW1",
        fechaVencimiento: "2026-07-01",
        pagoFinal: 120.5,
      },
    ];

    const merged = mergeTickerProspects(base, remote);

    expect(merged).toHaveLength(3);
    expect(merged[0].pagoFinal).toBe(150);
    expect(merged[2].ticker).toBe("NEW1");
  });

  it("falls back to constants when sheet fetch fails", async () => {
    process.env.ALLOW_TICKER_SHEET_FETCH = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await getHydratedTickerProspectUncached();
    expect(result).toBe(TICKER_PROSPECT);
  });

  it("hydrates when sheet fetch succeeds", async () => {
    process.env.ALLOW_TICKER_SHEET_FETCH = "true";
    const csv = [
      "Ticker,Fecha Vencim.,Pago",
      "T30J6,30/06/2026,144.90",
      "NEW1,01/07/2026,120.50",
    ].join("\n");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => csv,
      }),
    );

    const result = await getHydratedTickerProspectUncached();

    expect(result.find((entry) => entry.ticker === "NEW1")).toBeDefined();
  });
});
