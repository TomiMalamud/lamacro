"use client";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Accion } from "@/lib/acciones";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  volume: {
    label: "Volumen",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface VolumeChartProps {
  acciones: Accion[];
}

export function VolumeChart({ acciones }: VolumeChartProps) {
  const chartData = acciones.map((accion) => ({
    ticker: accion.symbol,
    volume: accion.v,
  }));

  return (
    <ChartContainer config={chartConfig} className="max-h-[600px]">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 30, right: 0, bottom: 20, left: -20 }}
      >
        <XAxis dataKey="ticker" />
        <YAxis
          dataKey="volume"
          tickFormatter={(value) => `${value / 1000000}M`}
        />
        <CartesianGrid vertical={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="volume" radius={4} fill="hsl(var(--primary))">
          <LabelList
            position="top"
            dataKey="ticker"
            fillOpacity={1}
            angle={-90}
            offset={20}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
