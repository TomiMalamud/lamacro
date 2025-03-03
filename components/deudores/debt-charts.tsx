"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "../ui/chart";

const chartConfig = {
  valor: {
    label: "Valor actual"
  }
} satisfies ChartConfig;

// Helper function for currency formatting
function formatCurrency(amount: number | null): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(amount);
}

// Format period from YYYYMM to a more readable format (e.g., "Diciembre 2024")
function formatPeriod(periodString: string | null): string {
  if (!periodString || periodString.length !== 6) return periodString || "N/A";

  const year = periodString.substring(0, 4);
  const month = parseInt(periodString.substring(4, 6));

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];

  return `${monthNames[month - 1]} ${year}`;
}

// Types for our components
export interface HistorialChartProps {
  periodos: Array<{
    periodo: string | null;
    entidades: Array<{
      entidad: string | null;
      situacion: number | null;
      monto: number | null;
      enRevision: boolean;
      procesoJud: boolean;
    }> | null;
  }> | null;
}

export function HistorialChart({ periodos }: HistorialChartProps) {
  if (!periodos || periodos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución Histórica</CardTitle>
          <CardDescription>
            Visualización histórica de situaciones crediticias y montos
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No hay suficientes datos para mostrar el gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for visualization
  const chartData = periodos
    .slice()
    .reverse()
    .map((periodo) => {
      const situacionMontos = [0, 0, 0, 0, 0, 0];
      let totalMonto = 0;

      periodo.entidades?.forEach((entidad) => {
        if (
          entidad.situacion !== null &&
          entidad.situacion >= 1 &&
          entidad.situacion <= 6 &&
          entidad.monto !== null
        ) {
          situacionMontos[entidad.situacion - 1] += entidad.monto;
          totalMonto += entidad.monto;
        }
      });

      return {
        periodo: formatPeriod(periodo.periodo),
        rawPeriodo: periodo.periodo,
        montoTotal: totalMonto,
        situacion1: situacionMontos[0],
        situacion2: situacionMontos[1],
        situacion3: situacionMontos[2],
        situacion4: situacionMontos[3],
        situacion5: situacionMontos[4],
        situacion6: situacionMontos[5]
      };
    });

  return (
    <div className="grid gap-6">
      {/* Debt Situation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Montos por Situación Crediticia</CardTitle>
          <CardDescription>
            Monto total de deuda por situación crediticia a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="periodo"
                fontSize={12}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("es-AR", {
                    notation: "compact",
                    compactDisplay: "short",
                    maximumFractionDigits: 1
                  }).format(value)
                }
              />
              <ChartTooltip
                formatter={(value, name) => {
                  const nameStr =
                    typeof name === "string"
                      ? name.replace("situacion", "Situación ")
                      : `Situación ${name}`;
                  return [formatCurrency(value as number), nameStr];
                }}
                content={
                  <ChartTooltipContent indicator="dot" nameKey="dataKey" />
                }
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px"
                }}
              />
              <Bar
                dataKey="situacion1"
                stackId="a"
                fill="#22c55e"
                name="Normal"
              />
              <Bar
                dataKey="situacion2"
                stackId="a"
                fill="#84cc16"
                name="Riesgo Bajo"
              />
              <Bar
                dataKey="situacion3"
                stackId="a"
                fill="#eab308"
                name="Riesgo Medio"
              />
              <Bar
                dataKey="situacion4"
                stackId="a"
                fill="#f97316"
                name="Riesgo Alto"
              />
              <Bar
                dataKey="situacion5"
                stackId="a"
                fill="#ef4444"
                name="Irrecuperable"
              />
              <Bar
                dataKey="situacion6"
                stackId="a"
                fill="#7c3aed"
                name="Irrecuperable DT"
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Total Debt Amount Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución del Monto Total de Deuda</CardTitle>
          <CardDescription>
            Monto total de deuda a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <LineChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="periodo"
                fontSize={12}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("es-AR", {
                    notation: "compact",
                    compactDisplay: "short",
                    maximumFractionDigits: 1
                  }).format(value)
                }
              />
              <ChartTooltip
                formatter={(value) => [
                  formatCurrency(value as number),
                  " Monto Total"
                ]}
                content={
                  <ChartTooltipContent indicator="dot" nameKey="dataKey" />
                }
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px"
                }}
              />
              <Line
                type="monotone"
                dataKey="montoTotal"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Monto Total de Deuda"
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
