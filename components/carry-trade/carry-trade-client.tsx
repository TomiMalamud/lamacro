"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CPI_EST, EST_DATE_STR } from "@/lib/carry-trade-data";
import { formatARS, formatPercent } from "@/lib/formatters";
import type { CarryExitData, CarryTradeData } from "@/types/carry-trade";
import { addDays, format, parseISO } from "date-fns";
import { CarryExitTable } from "./carry-exit-table";
import { CarryTable } from "./carry-table";
import { MepBreakevenChart } from "./mep-breakeven-chart";

interface CarryTradeClientProps {
  carryTradeData: CarryTradeData;
  carryExitSimulation: CarryExitData[];
}

// Helper function to find the best item based on a key
function findBest<T>(items: T[], key: keyof T): T | null {
  if (!items || items.length === 0) return null;
  return items.reduce((best, current) =>
    (current[key] as number) > (best[key] as number) ? current : best
  );
}

export function CarryTradeClient({
  carryTradeData,
  carryExitSimulation,
}: CarryTradeClientProps) {

  // Find best options
  const bestCarryBond = findBest(carryTradeData?.carryData ?? [], 'carry_worst');
  const bestExitBond = findBest(carryExitSimulation ?? [], 'ars_tea');

  // Basic check if data is available
  if (!carryTradeData?.carryData?.length) {
    return <p>No se pudieron cargar los datos de carry trade.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Section 0: Best Options Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {bestCarryBond && (
          <Card>
            <CardHeader>
              <CardTitle>Mejor Opción Carry (Hold)</CardTitle>
              <CardDescription>Bono con mayor rendimiento estimado conservador (peor caso) manteniendo hasta el vencimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Ticker:</strong> {bestCarryBond.symbol}</p>
              <p><strong>Carry en el peor de los casos:</strong> <span className={bestCarryBond.carry_worst > 0 ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"}>{formatPercent(bestCarryBond.carry_worst)}</span></p>
              <p><strong>TEM:</strong> {formatPercent(bestCarryBond.tem, 2)}</p>
              <p><strong>MEP Breakeven:</strong> {formatARS(bestCarryBond.mep_breakeven)}</p>
              <p><strong>Días al Vencimiento:</strong> {bestCarryBond.days_to_exp} <span className="text-muted-foreground font-normal">{format(addDays(new Date(), bestCarryBond.days_to_exp), 'dd/MM/yyyy')}</span></p>
            </CardContent>
          </Card>
        )}
        {bestExitBond && (
          <Card>
            <CardHeader>
              <CardTitle>Mejor Opción Salida Anticipada</CardTitle>
              <CardDescription>Bono con mayor rendimiento anualizado simulando salida temprana por compresión de tasa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Ticker:</strong> {bestExitBond.symbol}</p>
              <p><strong>TEA Estimada (ARS):</strong> <span className="text-green-600 dark:text-green-400 font-semibold">{formatPercent(bestExitBond.ars_tea)}</span></p>
              <p><strong>Rendimiento Directo (ARS):</strong> {formatPercent(bestExitBond.ars_direct_yield)}</p>
              <p><strong>Precio Salida Estimado:</strong> {formatARS(bestExitBond.bond_price_out)}</p>
              <p><strong>Días Invertido:</strong> {bestExitBond.days_in} <span className="text-muted-foreground font-normal">{format(addDays(new Date(), bestExitBond.days_in), 'dd/MM/yyyy')}</span></p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 1: Carry Trade Analysis Table & Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Carry Trade (ARS a MEP)</CardTitle>
          <CardDescription>
            Rendimiento estimado de mantener bonos en ARS hasta el vencimiento y convertir a Dólar MEP. <span className="font-bold">MEP Actual: ${carryTradeData.mep?.toFixed(2)}</span>
            <p>Hacé click en el encabezado de la tabla para ver qué significa cada columna</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CarryTable data={carryTradeData.carryData} mep={carryTradeData.mep} />
        </CardContent>
      </Card>
      <MepBreakevenChart data={carryTradeData.carryData} />
      {/* Section 2: Early Exit Simulation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Simulación de Salida Anticipada (Compresión de Tasa)</CardTitle>
          <CardDescription>
            Estimación de rendimiento en ARS saliendo antes del vencimiento el {format(parseISO(EST_DATE_STR), 'dd/MM/yy')} ({carryExitSimulation[0]?.days_in} días de tenencia), asumiendo una convergencia de la TEM a un valor estimado de {formatPercent(CPI_EST)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarryExitTable data={carryExitSimulation} />
        </CardContent>
      </Card>

    </div>
  );
} 