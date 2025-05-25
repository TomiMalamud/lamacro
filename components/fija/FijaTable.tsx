import { SecurityData, FijaTableRow } from "@/types/fija";
import { FIJA_TABLE_CONFIG } from "@/lib/fija-data";
import {
  calculateDaysDifference,
  calculateDays360,
  calculateTNA,
  calculateTEM,
  calculateTEA,
} from "@/lib/fija-calculations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseLocalDate, formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";

interface FijaTableProps {
  letras: SecurityData[];
  bonos: SecurityData[];
}

export default function FijaTable({ letras, bonos }: FijaTableProps) {
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

  const calculateTableData = (): FijaTableRow[] => {
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
    });
  };

  const tableData = calculateTableData();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Liquidación Secundaria</TableHead>
          <TableHead>Días</TableHead>
          <TableHead>Meses</TableHead>
          <TableHead>Precio actual</TableHead>
          <TableHead>Pago Final</TableHead>
          <TableHead>TNA</TableHead>
          <TableHead>TEM</TableHead>
          <TableHead>TEA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((row) => (
          <TableRow key={row.ticker}>
            <TableCell>{row.ticker}</TableCell>
            <TableCell>{row.fechaVencimiento}</TableCell>
            <TableCell>{row.liquiSecu}</TableCell>
            <TableCell>{row.dias}</TableCell>
            <TableCell>{formatNumber(row.meses)}</TableCell>
            <TableCell>{row.px > 0 ? formatNumber(row.px) : "-"}</TableCell>
            <TableCell>{formatNumber(row.pagoFinal)}</TableCell>
            <TableCell>
              {row.px > 0 && row.tna < 1
                ? formatNumber(row.tna, 2, "percentage")
                : "-"}
            </TableCell>
            <TableCell>
              {row.px > 0 && row.meses > 0 && row.tna < 1
                ? formatNumber(row.tem, 2, "percentage")
                : "-"}
            </TableCell>
            <TableCell>
              {row.px > 0 && row.tna < 1
                ? formatNumber(row.tea, 2, "percentage")
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
