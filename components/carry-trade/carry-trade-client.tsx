"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarryExitData, CarryTradeData } from "@/types/carry-trade";
import { CarryExitTable } from "./carry-exit-table";
import { CarryTable } from "./carry-table";
import { MepBreakevenChart } from "./mep-breakeven-chart";

interface CarryTradeClientProps {
  carryTradeData: CarryTradeData;
  carryExitSimulation: CarryExitData[];
}

export function CarryTradeClient({
  carryTradeData,
  carryExitSimulation,
}: CarryTradeClientProps) {

  // Basic check if data is available
  if (!carryTradeData?.carryData?.length) {
    return <p>No se pudieron cargar los datos de carry trade.</p>;
  }

  return (
    <div className="space-y-8">
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
            Estimación de rendimiento en ARS saliendo antes del vencimiento, asumiendo una convergencia de la TEM a un valor estimado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarryExitTable data={carryExitSimulation} />
        </CardContent>
      </Card>

    </div>
  );
} 