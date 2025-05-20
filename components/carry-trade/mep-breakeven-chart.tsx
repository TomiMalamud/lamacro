"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ProcessedBondData } from "@/types/carry-trade";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface MepBreakevenChartProps {
  data: ProcessedBondData[];
}

const chartConfig = {
  mep_breakeven: {
    label: "MEP Breakeven",
    color: "hsl(var(--chart-1))",
  },
  finish_worst: {
    label: "MEP Estimado (Peor Escenario)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProcessedBondData; // Access the full bond data
    return (
      <div className="rounded-lg border bg-background p-2 shadow-xs text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Ticker
            </span>
            <span className="font-bold text-muted-foreground">
              {data.symbol} ({format(new Date(data.expiration), "MMM-yy")})
            </span>
          </div>
        </div>
        <div className="mt-2 grid gap-1.5">
          {payload.map((item) => (
            <div key={item.dataKey} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color)"
                style={{ "--color": item.color } as React.CSSProperties}
              />
              <p className="text-muted-foreground">{item.name}:</p>
              <p className="font-medium text-foreground">
                $
                {item.value?.toLocaleString("es-AR", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function MepBreakevenChart({ data }: MepBreakevenChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <AreaChart
        data={data}
        accessibilityLayer
        margin={{
          left: 12,
          right: 12,
          top: 12,
          bottom: 12,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="symbol"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          angle={-45}
          textAnchor="end"
          height={50}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          tickFormatter={(value) =>
            `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
          }
          axisLine={false}
          tickLine={false}
          domain={["dataMin", "dataMax"]}
        />
        <ChartTooltip cursor={true} content={<CustomTooltip />} />
        <ChartLegend content={<ChartLegendContent />} />
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-finish_worst)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-finish_worst)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <defs>
          <linearGradient id="fillMepBreakeven" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-mep_breakeven)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-mep_breakeven)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="finish_worst"
          type="natural"
          fill="url(#fillValue)"
          fillOpacity={0.4}
          stroke="var(--color-finish_worst)"
          name="MEP Estimado (Peor Escenario)"
          dot={false}
        />
        <Area
          dataKey="mep_breakeven"
          type="natural"
          fill="url(#fillMepBreakeven)"
          fillOpacity={0.4}
          stroke="var(--color-mep_breakeven)"
          name="MEP Breakeven"
          dot={false}
        ></Area>
      </AreaChart>
    </ChartContainer>
  );
}
