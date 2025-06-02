"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { getMonthName, useInflationData } from "./calculator";

interface ChartData {
  date: string;
  value: number;
}

interface InflationChartProps {
  startMonth: number;
  startYear: number;
  startValue: number;
  endMonth: number;
  endYear: number;
}

const chartConfig = {
  value: {
    label: "Evolución",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function InflationChart({
  startMonth,
  startYear,
  startValue,
  endMonth,
  endYear,
}: InflationChartProps) {
  const { inflationData } = useInflationData();

  const chartData = useMemo(() => {
    const data: ChartData[] = [];
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

    let currentValue = startValue;
    let currentMonth = startMonth;
    let currentYear = startYear;

    // Add initial value
    data.push({
      date: `${getMonthName(currentMonth)} ${currentYear}`,
      value: currentValue,
    });

    // Calculate value for each month using real inflation rates
    for (let i = 0; i < totalMonths; i++) {
      const yearData = inflationData[currentYear.toString()] || {};
      const monthRate = yearData[currentMonth.toString()] || 0;

      // Apply monthly inflation rate
      currentValue = currentValue * (1 + monthRate);

      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      data.push({
        date: `${getMonthName(currentMonth)} ${currentYear}`,
        value: Math.round(currentValue * 100) / 100,
      });
    }

    return data;
  }, [startMonth, startYear, endMonth, endYear, startValue, inflationData]);

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full my-12">
      <AreaChart
        data={chartData}
        accessibilityLayer
        margin={{
          left: -10,
          right: 0,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="equidistantPreserveStart"
          tickFormatter={(value) => {
            const [month, year] = value.split(" ");
            return `${month.slice(0, 3)}-${year.slice(2)}`;
          }}
        />
        <YAxis
          tickFormatter={(value) =>
            new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-value)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="natural"
          fill="url(#fillValue)"
          fillOpacity={0.4}
          stroke="var(--color-value)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
