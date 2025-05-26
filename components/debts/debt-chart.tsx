"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber, formatPeriod } from "@/lib/utils";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

const chartConfig = {
  situacion1: {
    label: "Normal",
    color: "#22c55e",
  },
  situacion2: {
    label: "Riesgo Bajo",
    color: "#84cc16",
  },
  situacion3: {
    label: "Riesgo Medio",
    color: "#eab308",
  },
  situacion4: {
    label: "Riesgo Alto",
    color: "#f97316",
  },
  situacion5: {
    label: "Irrecuperable",
    color: "#ef4444",
  },
  situacion6: {
    label: "Irrecuperable DT",
    color: "#7c3aed",
  },
  montoTotal: {
    label: "Monto Total de Deuda",
    color: "#3b82f6", // Matching the line color
  },
} satisfies ChartConfig;

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
      <div className="md:hidden">
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Evolución Histórica
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Visualización histórica de situaciones crediticias y montos
        </p>
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No hay suficientes datos para mostrar el gráfico
        </div>
      </div>
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
        situacion6: situacionMontos[5],
      };
    });

  const chartContent = (
    <ChartContainer
      config={chartConfig}
      className="h-[350px] w-full aspect-auto"
    >
      <ComposedChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 0, right: 0, left: 0, bottom: 60 }}
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
              maximumFractionDigits: 1,
            }).format(value)
          }
        />
        <ChartTooltip
          formatter={(value, name) => {
            const nameStr =
              typeof name === "string"
                ? name.replace("situacion", "Situación ")
                : `Situación ${name}`;
            return ["$ " + formatNumber(value as number) + " ", nameStr];
          }}
          content={<ChartTooltipContent indicator="dot" nameKey="dataKey" />}
        />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
        <Bar dataKey="situacion1" stackId="a" fill="#22c55e" name="Normal" />
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
        <Line
          type="natural"
          dataKey="montoTotal"
          stroke="#3b82f6"
          strokeWidth={1}
          name="Monto Total de Deuda"
          dot={{
            fill: "#3b82f6",
          }}
          activeDot={{
            r: 6,
          }}
        />
      </ComposedChart>
    </ChartContainer>
  );

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Montos por Situación Crediticia
          </h2>
        </div>
        {chartContent}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block px-0">
        <CardHeader>
          <CardTitle>Montos por Situación Crediticia</CardTitle>
          <CardDescription>
            Monto total de deuda por situación crediticia a lo largo del tiempo
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-0 pr-2">{chartContent}</CardContent>
      </Card>
    </>
  );
}
