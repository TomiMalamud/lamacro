import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatARS, formatPercent } from "@/lib/formatters";
import type { CarryExitData } from "@/types/carry-trade";

interface CarryExitTableProps {
  data: CarryExitData[];
}

export function CarryExitTable({ data }: CarryExitTableProps) {
  if (!data || data.length === 0) {
    return <p>No hay datos disponibles para la simulación de salida anticipada.</p>;
  }

  const exitTEM = data[0]?.exit_TEM;


  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">
              <Popover>
                <PopoverTrigger>
                  Días para Salida
                </PopoverTrigger>
                <PopoverContent>
                  Cuántos días faltaban para el vencimiento del bono cuando vendiste.
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="text-right">Precio Entrada</TableHead>
            <TableHead className="text-right">Precio Salida (Est)</TableHead>
            <TableHead className="text-right">Rendimiento</TableHead>
            <TableHead className="text-right">TEA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sim) => (
            <TableRow key={sim.symbol}>
              <TableCell className="font-medium">{sim.symbol}</TableCell>
              <TableCell className="text-right">{sim.days_to_exp}</TableCell>
              <TableCell className="text-right">{formatARS(sim.bond_price_in)}</TableCell>
              <TableCell className="text-right">{formatARS(sim.bond_price_out)}</TableCell>
              <TableCell className="text-right font-mono">{formatPercent(sim.ars_direct_yield, 0)}</TableCell>
              <TableCell className="text-right font-mono">{formatPercent(sim.ars_tea, 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {exitTEM !== undefined && (
        <p className="text-xs text-muted-foreground mt-2">
          * Simulación asumiendo una salida en la fecha estimada con una TEM del {formatPercent(exitTEM, 2)}.
        </p>
      )}
    </div>
  );
} 