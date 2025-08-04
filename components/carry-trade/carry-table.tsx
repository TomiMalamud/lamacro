import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatNumber } from "@/lib/utils";
import type { ProcessedBondData } from "@/types/carry-trade";

interface CarryTableProps {
  data: ProcessedBondData[];
  mep: number;
}

const CARRY_PRICES = [1200, 1300, 1400];
const carryColumnKeys = CARRY_PRICES.map((price) => `carry_${price}` as const);

export function CarryTable({ data, mep }: CarryTableProps) {
  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table className="min-w-full text-xs sm:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger>Ticker</TooltipTrigger>
                  <TooltipContent>
                    Ticker que representa el bono. Buscalo así en tu broker.
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-right">
                <Tooltip>
                  <TooltipTrigger>Precio</TooltipTrigger>
                  <TooltipContent>Precio del bono actual</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-right">
                <Tooltip>
                  <TooltipTrigger>Días</TooltipTrigger>
                  <TooltipContent>Días hasta el vencimiento</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-right">
                <Tooltip>
                  <TooltipTrigger>TEM</TooltipTrigger>
                  <TooltipContent>Tasa Efectiva Mensual</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-right">
                <Tooltip>
                  <TooltipTrigger>Carry {mep.toFixed(0)}</TooltipTrigger>
                  <TooltipContent>
                    Se toma un dólar de $ {formatNumber(Number(mep))} (Valor MEP
                    actual) para calcular el carry hasta el vencimiento.
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              {carryColumnKeys.map((colKey) => (
                <TableHead
                  key={colKey}
                  className={cn(
                    "text-right",
                    colKey === "carry_1100" ||
                      colKey === "carry_1200" ||
                      colKey === "carry_1300"
                      ? "hidden md:table-cell"
                      : "",
                  )}
                >
                  <Tooltip key={colKey}>
                    <TooltipTrigger>
                      {`Carry ${colKey.split("_")[1]}`}
                    </TooltipTrigger>
                    <TooltipContent>
                      Se toma un dólar de ${" "}
                      {formatNumber(Number(colKey.split("_")[1]))} para calcular
                      el carry hasta el vencimiento.
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              ))}
              <TableHead className="text-right">
                <Tooltip>
                  <TooltipTrigger>Carry Peor</TooltipTrigger>
                  <TooltipContent align="end">
                    Peor caso del Carry. Se toma el techo de la banda para el
                    cálculo hasta el vencimiento.
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((bond) => (
              <TableRow key={bond.symbol}>
                <TableCell className="font-medium">{bond.symbol}</TableCell>
                <TableCell className="text-right">
                  $ {formatNumber(bond.bond_price)}
                </TableCell>
                <TableCell className="text-right">{bond.days_to_exp}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(bond.tem, 2, "percentage")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    bond.carry_mep > 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {formatNumber(bond.carry_mep, 1, "percentage")}
                </TableCell>
                {carryColumnKeys.map((colKey) => {
                  const carryValue = bond[colKey];
                  return (
                    <TableCell
                      key={colKey}
                      className={cn(
                        "text-right font-mono",
                        carryValue > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                        colKey === "carry_1100" ||
                          colKey === "carry_1200" ||
                          colKey === "carry_1300"
                          ? "hidden md:table-cell"
                          : "",
                      )}
                    >
                      {formatNumber(carryValue, 1, "percentage")}
                    </TableCell>
                  );
                })}
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    bond.carry_worst > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatNumber(bond.carry_worst, 1, "percentage")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
