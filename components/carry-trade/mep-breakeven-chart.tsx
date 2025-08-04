"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ProcessedBondData } from "@/types/carry-trade";
import { format } from "date-fns";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Scatter,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface MepBreakevenChartProps {
  data: ProcessedBondData[];
}

const chartConfig = {
  mep_breakeven: {
    label: "Breakeven",
    color: "var(--chart-1)",
  },
  band: {
    label: "Rango de Proyección",
    color: "var(--muted)",
  },
} satisfies ChartConfig;

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;

    // Check if we have band data (projection range) - it's an array [lower, upper]
    const band = dataPoint.band as [number, number] | undefined;
    const lowerLimit = band?.[0];
    const upperLimit = band?.[1];

    // Find bond data from the current data point
    const bondEntries = Object.entries(dataPoint).filter(
      ([key]) =>
        key.startsWith("symbol_") ||
        key.startsWith("mep_breakeven_") ||
        key.startsWith("expiration_"),
    );

    const hasBondData = bondEntries.some(([key]) => key.startsWith("symbol_"));
    const hasBandData = lowerLimit !== undefined && upperLimit !== undefined;

    // If we have neither bond nor band data, don't show tooltip
    if (!hasBondData && !hasBandData) {
      return null;
    }

    return (
      <div className="rounded-lg border bg-background p-2 shadow-xs text-xs">
        {/* Bond Information Section */}
        {hasBondData &&
          (() => {
            const bondIndex =
              bondEntries
                .find(([key]) => key.startsWith("symbol_"))?.[0]
                .split("_")[1] || "0";
            const symbol = dataPoint[`symbol_${bondIndex}`];
            const expiration = dataPoint[`expiration_${bondIndex}`];
            const mepBreakeven = dataPoint[`mep_breakeven_${bondIndex}`];

            if (symbol && expiration) {
              return (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <span className="font-bold text-muted-foreground">
                      {symbol} ({format(new Date(expiration), "MMM-yy")})
                    </span>
                  </div>
                  <div className="grid gap-1.5">
                    {mepBreakeven && (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: "var(--chart-1)" }}
                        />
                        <p className="text-muted-foreground">Breakeven:</p>
                        <p className="font-medium text-foreground">
                          $
                          {mepBreakeven.toLocaleString("es-AR", {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            }
            return null;
          })()}

        {/* Band Information Section */}
        {hasBandData && (
          <div
            className={`grid gap-1.5 ${hasBondData ? "mt-3 pt-2 border-t border-muted" : ""}`}
          >
            {!hasBondData && (
              <div className="mb-2">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Rango de Proyección
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: "var(--muted-foreground)",
                  opacity: 0.6,
                }}
              />
              <p className="text-muted-foreground">Límite Superior:</p>
              <p className="font-medium text-foreground">
                $
                {upperLimit.toLocaleString("es-AR", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: "var(--muted-foreground)",
                  opacity: 0.6,
                }}
              />
              <p className="text-muted-foreground">Límite Inferior:</p>
              <p className="font-medium text-foreground">
                $
                {lowerLimit.toLocaleString("es-AR", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function MepBreakevenChart({ data }: MepBreakevenChartProps) {
  // Generate projection data
  const generateProjectionData = () => {
    const data = [];
    const endDate = new Date(2027, 1, 14); // January 14, 2027

    let upperValue = 1400;
    let lowerValue = 1000;

    // First data point (start)
    data.push({
      date: "14/04/2025",
      band: [lowerValue, upperValue],
    });

    // Calculate first partial month (April 14 to May 1 = 17 days)
    const daysToMay1 = 17;
    const partialMonthRatio = daysToMay1 / 30;
    upperValue = upperValue * (1 + 0.01 * partialMonthRatio);
    lowerValue = lowerValue * (1 - 0.01 * partialMonthRatio);

    data.push({
      date: "01/05/2025",
      band: [
        Math.round(lowerValue * 100) / 100,
        Math.round(upperValue * 100) / 100,
      ],
    });

    // Generate data for first day of each month
    const currentDate = new Date(2025, 4, 1); // Start from May 1, 2025

    while (currentDate <= endDate) {
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);

      if (currentDate > endDate) break;

      // Apply 1% growth/decline per month
      upperValue = upperValue * 1.01;
      lowerValue = lowerValue * 0.99;

      const day = String(currentDate.getDate()).padStart(2, "0");
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const year = currentDate.getFullYear();

      data.push({
        date: `${day}/${month}/${year}`,
        band: [
          Math.round(lowerValue * 100) / 100,
          Math.round(upperValue * 100) / 100,
        ],
      });
    }

    return data;
  };

  const projectionData = generateProjectionData();

  // Create scatter data for bonds
  const scatterData = data.map((bondData, bondIndex) => {
    const bondExpDate = new Date(bondData.expiration);
    const bondDateStr = `${String(bondExpDate.getDate()).padStart(2, "0")}/${String(bondExpDate.getMonth() + 1).padStart(2, "0")}/${bondExpDate.getFullYear()}`;

    const dataPoint: Record<string, unknown> = {
      date: bondDateStr,
      [`symbol_${bondIndex}`]: bondData.symbol,
      [`expiration_${bondIndex}`]: bondData.expiration,
      originalData: bondData,
    };

    // Include default values
    dataPoint[`mep_breakeven_${bondIndex}`] = bondData.mep_breakeven;

    return dataPoint;
  });

  // Sort projection data once for efficient lookup
  const sortedProjectionData = [...projectionData].sort((a, b) => {
    const dateA = new Date(a.date.split("/").reverse().join("-"));
    const dateB = new Date(b.date.split("/").reverse().join("-"));
    return dateA.getTime() - dateB.getTime();
  });

  // Combine all unique dates from both sources
  const allDates = new Set<string>([
    ...projectionData.map((d) => d.date),
    ...scatterData.map((d) => d.date as string),
  ]);

  // Build the final chartData with interpolation and correct merging
  const chartData = Array.from(allDates)
    .sort((a, b) => {
      const dateA = new Date(a.split("/").reverse().join("-"));
      const dateB = new Date(b.split("/").reverse().join("-"));
      return dateA.getTime() - dateB.getTime();
    })
    .map((date) => {
      const chartPoint: Record<string, unknown> = { date };

      // Find existing projection point
      const existingProjectionPoint = sortedProjectionData.find(
        (p) => p.date === date,
      );

      if (existingProjectionPoint) {
        chartPoint.band = existingProjectionPoint.band;
      } else {
        // If no exact match, interpolate the band data
        const currentDate = new Date(date.split("/").reverse().join("-"));
        let prevPoint: { date: string; band: number[] } | undefined;
        let nextPoint: { date: string; band: number[] } | undefined;

        // Find the surrounding projection points for interpolation
        for (let i = 0; i < sortedProjectionData.length; i++) {
          const pDate = new Date(
            sortedProjectionData[i].date.split("/").reverse().join("-"),
          );
          if (pDate < currentDate) {
            prevPoint = sortedProjectionData[i];
          } else if (pDate > currentDate) {
            nextPoint = sortedProjectionData[i];
            break;
          }
        }

        if (prevPoint && nextPoint) {
          const prevDate = new Date(
            prevPoint.date.split("/").reverse().join("-"),
          );
          const nextDate = new Date(
            nextPoint.date.split("/").reverse().join("-"),
          );

          const totalDuration = nextDate.getTime() - prevDate.getTime();
          const elapsedDuration = currentDate.getTime() - prevDate.getTime();
          const ratio = totalDuration > 0 ? elapsedDuration / totalDuration : 0;

          const interpolatedLower =
            prevPoint.band[0] + (nextPoint.band[0] - prevPoint.band[0]) * ratio;
          const interpolatedUpper =
            prevPoint.band[1] + (nextPoint.band[1] - prevPoint.band[1]) * ratio;

          chartPoint.band = [interpolatedLower, interpolatedUpper];
        }
      }

      // Correctly merge ALL scatter points for the current date
      const scatterPointsForDate = scatterData.filter((s) => s.date === date);
      if (scatterPointsForDate.length > 0) {
        scatterPointsForDate.forEach((sp) => {
          Object.keys(sp).forEach((key) => {
            if (key !== "date") {
              chartPoint[key] = sp[key];
            }
          });
        });
      }

      return chartPoint;
    });

  const allValues = chartData.flatMap((d) =>
    Array.isArray(d.band) ? (d.band as number[]) : [],
  );
  const mepValues = data.map((d) => d.mep_breakeven);
  const allYValues = [...allValues, ...mepValues];
  const minValue = Math.min(...allYValues) - 50;
  const maxValue = Math.max(...allYValues) + 50;

  const renderUnifiedTooltip = (props: TooltipProps<number, string>) => {
    return <CustomTooltip {...props} />;
  };

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ComposedChart
        data={chartData}
        accessibilityLayer
        margin={{
          left: 0,
          right: 14,
          top: 30,
          bottom: 14,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          domain={[minValue, maxValue]}
          tickFormatter={(value) =>
            `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
          }
        />
        <ChartTooltip cursor={true} content={renderUnifiedTooltip} />
        <Area
          type="monotone"
          dataKey="band"
          stroke="none"
          fill="var(--muted-foreground)"
          fillOpacity={0.1}
          connectNulls
          dot={false}
          activeDot={false}
        />
        {data.map((_, bondIndex) => (
          <Scatter
            key={`mep_breakeven_${bondIndex}`}
            dataKey={`mep_breakeven_${bondIndex}`}
            fill="var(--chart-1)"
            name={`mep_breakeven_${bondIndex}`}
            legendType="circle"
            r={4}
          >
            <LabelList
              dataKey={`symbol_${bondIndex}`}
              position="top"
              style={{
                fontSize: "10px",
                fill: "var(--chart-1)",
                fontWeight: "bold",
              }}
            />
          </Scatter>
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
