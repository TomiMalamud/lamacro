import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProcessedBondData } from "@/types/carry-trade";

interface CarryTableProps {
  data: ProcessedBondData[];
  mep: number;
}

const CARRY_PRICES = [1200, 1300, 1400];
const carryColumnKeys = CARRY_PRICES.map((price) => `carry_${price}` as const);

export function CarryTable({ data, mep }: CarryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Popover>
                <PopoverTrigger>Ticker</PopoverTrigger>
                <PopoverContent>
                  Ticker que representa el bono. Buscalo así en tu broker.
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>Precio</PopoverTrigger>
                <PopoverContent>Precio del bono actual</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>Días</PopoverTrigger>
                <PopoverContent>Días hasta el vencimiento</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>TEM</PopoverTrigger>
                <PopoverContent>Tasa Efectiva Mensual</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>Carry {mep.toFixed(0)}</PopoverTrigger>
                <PopoverContent>
                  Carry para MEP al valor actual ($ {formatNumber(mep)})
                </PopoverContent>
              </Popover>
            </TableHead>
            {/* Dynamic headers for carry columns */}
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
                {`Carry ${colKey.split("_")[1]}`}
              </TableHead>
            ))}
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>Carry Peor</PopoverTrigger>
                <PopoverContent>
                  Peor caso del Carry. Asume que el MEP arranca en 1400 e
                  incrementa 1% por mes hasta el vencimiento.
                </PopoverContent>
              </Popover>
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
                  bond.carry_mep > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
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
  );
}
