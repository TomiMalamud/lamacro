"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import type { ProcessedTamarData } from "@/types/carry-trade";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

interface TamarComparisonChartProps {
  data: ProcessedTamarData[];
}

// Define chart config with specific colors from the python example (approximated)
const chartConfig = {
  tamar_tem_spot: {
    label: "TAMAR TEM Spot",
    color: "hsl(0 0% 100%)", // white
  },
  tamar_tem_avg: {
    label: "TAMAR TEM Promedio",
    color: "hsl(0 0% 90%)", // light-gray (adjusted from white)
  },
  TTM26: {
    label: "TTM26 TEM",
    color: "hsl(346 100% 80%)", // pinkish
  },
  TTJ26: {
    label: "TTJ26 TEM",
    color: "hsl(60 100% 75%)", // yellowish
  },
  TTS26: {
    label: "TTS26 TEM",
    color: "hsl(38 100% 70%)", // orangeish
  },
  TTD26: {
    label: "TTD26 TEM",
    color: "hsl(0 0% 70%)", // gray
  },
} satisfies ChartConfig;

// Helper to format numbers as percentages for the Y axis and tooltip
const formatPercent = (value: number | null | undefined, digits = 2): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return "-";
  // Check for very small numbers that might round to 0.00%
  if (Math.abs(value * 100) < 0.005 && value !== 0) {
    return value.toExponential(1); // Use scientific notation if too small
  }
  return `${(value * 100).toFixed(digits)}%`;
};


export function TamarComparisonChart({ data }: TamarComparisonChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          accessibilityLayer
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => format(new Date(value), "MMM-yy")} // Format date ticks
            tick={{ fontSize: 10 }}
          />
          <YAxis
            tickFormatter={(value) => formatPercent(value)} // Format as percentage
            axisLine={false}
            tickLine={false}
            width={70} // Adjust width for labels
            tick={{ fontSize: 10 }}
            domain={['auto', 'auto']} // Auto domain based on data
          />
          <ChartTooltip
            cursor={true}
            content={<ChartTooltipContent formatter={(value) => formatPercent(value as number)} />} // Format tooltip values
          />
          <ChartLegend content={<ChartLegendContent />} />

          {/* Map through the config keys to render lines dynamically */}
          {Object.keys(chartConfig).map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={key === 'tamar_tem_spot' ? 1.5 : 1} // Thicker spot line?
              strokeDasharray={key === 'tamar_tem_spot' ? "3 3" : undefined} // Dashed spot line
              dot={false}
              name={chartConfig[key as keyof typeof chartConfig].label} // Use label from config
              connectNulls={true} // Connect lines across null values if any
            />
          ))}

        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
} 