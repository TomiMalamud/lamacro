import { SecurityData, FijaTableRow } from "@/types/fija";
import { FIJA_TABLE_CONFIG } from "@/lib/fija-data";
import {
  calculateDaysDifference,
  calculateDays360,
  calculateTNA,
  calculateTEM,
  calculateTEA,
} from "@/lib/fija-calculations";
import { parseLocalDate } from "@/lib/utils";
import { formatDate } from "date-fns";
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
    return FIJA_TABLE_CONFIG.map((config) => {
      const fechaVencimiento = parseLocalDate(config.fechaVencimiento);
      const liquiSecuDate = parseLocalDate(config.liquidacionSecundaria);
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
        fechaVencimiento: formatDate(fechaVencimiento, "dd/MM/yyyy"),
        liquiSecu: formatDate(liquiSecuDate, "dd/MM/yyyy"),
        dias,
        meses,
        px,
        pagoFinal: config.pagoFinal,
        tna,
        tem,
        tea,
      };
    }).sort((a, b) => a.dias - b.dias);
  }, [letras, bonos, getPriceForTicker]);

  return { tableData };
}
