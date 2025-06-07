import {
  calculateDays360,
  calculateDaysDifference,
  calculateTEA,
  calculateTEM,
  calculateTNA,
  FIJA_TABLE_CONFIG,
} from "@/lib/fija";
import { formatDateAR, getNextBusinessDay } from "@/lib/utils";
import { FijaTableRow, SecurityData } from "@/types/fija";
import { parseISO } from "date-fns";
import { useMemo } from "react";

interface UseFijaDataProps {
  letras: SecurityData[];
  bonos: SecurityData[];
}

export function useFijaData({ letras, bonos }: UseFijaDataProps) {
  const getPriceForTicker = (ticker: string): number => {
    if (ticker.startsWith("S")) {
      const security = letras.find((item) => item.symbol === ticker);
      return security?.c || 0;
    } else if (ticker.startsWith("T")) {
      const security = bonos.find((item) => item.symbol === ticker);
      return security?.c || 0;
    }
    return 0;
  };

  const tableData = useMemo((): FijaTableRow[] => {
    const baseDate = getNextBusinessDay();

    return FIJA_TABLE_CONFIG.map((config) => {
      const fechaVencimiento = parseISO(config.fechaVencimiento);
      const liquiSecuDate =
        baseDate > fechaVencimiento ? fechaVencimiento : baseDate;
      const px = getPriceForTicker(config.ticker);

      const dias = calculateDaysDifference(fechaVencimiento, liquiSecuDate);
      const days360 = calculateDays360(fechaVencimiento, liquiSecuDate);
      const meses = days360 / 30;

      const tna = px > 0 ? calculateTNA(config.pagoFinal, px, dias) : 0;
      const tem =
        px > 0 && meses > 0 ? calculateTEM(config.pagoFinal, px, meses) : 0;
      const tea = px > 0 ? calculateTEA(config.pagoFinal, px, dias) : 0;

      return {
        ticker: config.ticker,
        fechaVencimiento: formatDateAR(fechaVencimiento.toISOString()),
        dias,
        meses,
        px,
        pagoFinal: config.pagoFinal,
        tna,
        tem,
        tea,
      };
    })
      .filter((item) => item.dias > 0)
      .sort((a, b) => a.dias - b.dias);
  }, [letras, bonos, getPriceForTicker]);

  return { tableData };
}
