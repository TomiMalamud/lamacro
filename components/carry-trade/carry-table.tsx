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
import { cn } from "@/lib/utils";
import type { ProcessedBondData } from "@/types/carry-trade";
interface CarryTableProps {
  data: ProcessedBondData[];
  mep: number; 
}

// Helper to format numbers as percentages
const formatPercent = (value: number | null | undefined, digits = 1): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
};

// Helper to format currency (ARS)
const formatARS = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

// Define which carry columns to display dynamically based on CARRY_PRICES in lib
const CARRY_PRICES = [1000, 1100, 1200, 1300, 1400];
const carryColumnKeys = CARRY_PRICES.map(price => `carry_${price}` as const); // Use const assertion

export function CarryTable({ data }: CarryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Popover>
                <PopoverTrigger>
                  Ticker
                </PopoverTrigger>
                <PopoverContent>
                  Ticker que representa el bono. Buscalo así en tu broker.
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  Precio
                </PopoverTrigger>
                <PopoverContent>Precio del bono actual</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  Días
                </PopoverTrigger>
                <PopoverContent>Días hasta el vencimiento</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  TEM
                </PopoverTrigger>
                <PopoverContent>Tasa Efectiva Mensual</PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  MEP Breakeven
                </PopoverTrigger>
                <PopoverContent>MEP Breakeven</PopoverContent>
              </Popover>
            </TableHead>
            {/* Dynamic headers for carry columns */}
            {carryColumnKeys.map(colKey => (
              <TableHead key={colKey} className="text-right">{`Carry ${colKey.split('_')[1]}`}</TableHead>
            ))}
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  Carry Peor
                </PopoverTrigger>
                <PopoverContent>Peor caso del Carry. Asume que el MEP arranca en 1400 e incrementa 1% por mes hasta el vencimiento.</PopoverContent>
              </Popover>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bond) => (
            <TableRow key={bond.symbol}>
              <TableCell className="font-medium">{bond.symbol}</TableCell>
              <TableCell className="text-right">{formatARS(bond.bond_price)}</TableCell>
              <TableCell className="text-right">{bond.days_to_exp}</TableCell>
              <TableCell className="text-right">{formatPercent(bond.tem, 2)}</TableCell>
              <TableCell className="text-right">{formatARS(bond.mep_breakeven)}</TableCell>
              {/* Dynamic cells for carry columns */}
              {carryColumnKeys.map(colKey => {
                // Explicitly access the known numeric carry properties
                const carryValue = bond[colKey];
                return (
                  <TableCell
                    key={colKey}
                    className={cn("text-right font-mono",
                      carryValue > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatPercent(carryValue)}
                  </TableCell>
                );
              })}
              <TableCell className={cn("text-right font-mono",
                bond.carry_worst > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatPercent(bond.carry_worst)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 