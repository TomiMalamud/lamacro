"use client";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Accion } from "@/lib/acciones";
import { fetchVariableTimeSeries } from "@/lib/bcra-fetch";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  ytdReturn: {
    label: "Retorno 2025",
  },
} satisfies ChartConfig;

interface AccionesChartProps {
  acciones: Accion[];
}

async function calculateAccumulatedInflation(): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetchVariableTimeSeries(27, "2025-01-01", today);

    if (!response.results || response.results.length === 0) {
      return 0;
    }

    let accumulatedInflation = 1;
    response.results.forEach((item) => {
      const monthlyRate = item.valor / 100;
      accumulatedInflation *= 1 + monthlyRate;
    });

    return (accumulatedInflation - 1) * 100;
  } catch (error) {
    console.error("Error fetching inflation data:", error);
    return 0;
  }
}

export function AccionesChart({ acciones }: AccionesChartProps) {
  const [inflationRate, setInflationRate] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    calculateAccumulatedInflation().then(setInflationRate);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const allData = acciones
    .filter(
      (accion) => accion.ytdReturn !== undefined && accion.ytdReturn !== null,
    )
    .map((accion) => ({
      ticker: accion.symbol,
      ytdReturn: accion.ytdReturn!,
    }))
    .sort((a, b) => a.ytdReturn - b.ytdReturn);

  const chartData = isMobile
    ? [...allData.slice(0, 6), ...allData.slice(-6)]
    : allData;

  return (
    <ChartContainer config={chartConfig} className="max-h-[700px]">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 20, right: 0, bottom: 20, left: -20 }}
      >
        <XAxis dataKey="ticker" />
        <YAxis
          dataKey="ytdReturn"
          tickFormatter={(value) => `${value}%`}
          tickCount={10}
        />
        <CartesianGrid vertical={false} />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="text-muted-foreground flex min-w-[130px] items-center text-xs">
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div
                    className={cn(
                      "text-foreground ml-2 flex items-baseline gap-0.5 font-mono font-medium tabular-nums",
                      Number(value) >= 0 && "text-[var(--positive)]",
                      Number(value) < 0 && "text-[var(--negative)]",
                    )}
                  >
                    {value}
                    <span className="text-muted-foreground font-normal">%</span>
                  </div>
                </div>
              )}
            />
          }
        />
        <ReferenceLine
          y={inflationRate}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="5 5"
          label={{
            value: `Inflación: ${inflationRate.toFixed(1)}%`,
            position: "top",
          }}
        />
        <Bar dataKey="ytdReturn" radius={4}>
          <LabelList
            position="top"
            dataKey="ticker"
            className="hidden lg:block fill-muted-foreground"
            offset={12}
          />
          {chartData.map((item) => (
            <Cell
              key={item.ticker}
              fill={item.ytdReturn > 0 ? "var(--positive)" : "var(--negative)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
