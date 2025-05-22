"use client";

import {
  type DualBondChartPoint,
  type DualBondScatterPoint,
  DUAL_BOND_EVENTS,
} from "@/lib/duales";
import React from "react";
import {
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

export const DUAL_BONDS_COLORS: Record<string, string> = {
  tamar_tem_spot: "white",
  tamar_AVG: "white",
  TTM26: "#ff8888",
  TTJ26: "#fb9f3f",
  TTS26: "#4af6c3",
  TTD26: "#66CCFF",
  projection_AVG: "silver",
};

const chartConfig = {
  tamar_tem_spot: {
    label: "TEM Spot TAMAR",
    color: DUAL_BONDS_COLORS.tamar_tem_spot,
  },
  tamar_AVG: {
    label: "Promedio Histórico TAMAR",
    color: DUAL_BONDS_COLORS.tamar_AVG,
  },
  TTM26_fixed_rate: {
    label: "TTM26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTM26,
  },
  TTJ26_fixed_rate: {
    label: "TTJ26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTJ26,
  },
  TTS26_fixed_rate: {
    label: "TTS26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTS26,
  },
  TTD26_fixed_rate: {
    label: "TTD26 Tasa Fija",
    color: DUAL_BONDS_COLORS.TTD26,
  },
  tamar_proy_AVG: {
    label: "Promedio Proyección TAMAR",
    color: DUAL_BONDS_COLORS.projection_AVG,
  },
} as const;

interface DualesTamarChartProps {
  chartData: DualBondChartPoint[];
  scatterPoints: DualBondScatterPoint[];
  eventDates: Record<string, string>;
  targetsTEM: number[];
}

export const DualesTamarChart: React.FC<DualesTamarChartProps> = ({
  chartData,
  scatterPoints,
  eventDates,
  targetsTEM,
}) => {
  if (!chartData || chartData.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No hay datos suficientes para mostrar el gráfico.
      </p>
    );
  }

  const yAxisTickFormatter = (value: number) => `${(value * 100).toFixed(1)}%`;

  let minY = Infinity;
  let maxY = -Infinity;
  chartData.forEach((point) => {
    Object.keys(point).forEach((key) => {
      if (key !== "date" && typeof point[key] === "number") {
        const val = point[key] as number;
        if (val < minY) minY = val;
        if (val > maxY) maxY = val;
      }
    });
  });

  return (
    <ChartContainer config={chartConfig}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tickFormatter={yAxisTickFormatter}
          tick={{ fontSize: 10 }}
          domain={["dataMin", "dataMax"]}
          padding={{ top: 30, bottom: 30 }}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="tamar_tem_spot"
          name="TEM Spot TAMAR"
          stroke={DUAL_BONDS_COLORS.tamar_tem_spot}
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="tamar_AVG"
          name="Promedio Histórico TAMAR"
          stroke={DUAL_BONDS_COLORS.tamar_AVG}
          strokeWidth={1.5}
          dot={false}
        />
        {Object.keys(DUAL_BOND_EVENTS).map((bondTicker) => (
          <Line
            key={`${bondTicker}_fixed_rate`}
            type="monotone"
            dataKey={`${bondTicker}_fixed_rate`}
            name={`${bondTicker} Tasa Fija`}
            stroke={DUAL_BONDS_COLORS[bondTicker]}
            strokeWidth={1.5}
            dot={false}
          />
        ))}
        {targetsTEM.length > 0 &&
          (() => {
            const currentTargetTEM = targetsTEM[0];
            const proyAvgKey = `tamar_proy_${(currentTargetTEM * 100).toFixed(1)}_AVG`;
            return (
              <Line
                key={proyAvgKey}
                type="monotone"
                dataKey={proyAvgKey}
                name={`Escenario TAMAR ${(currentTargetTEM * 100).toFixed(1)}% `}
                stroke={DUAL_BONDS_COLORS.projection_AVG}
                strokeWidth={1.5}
                dot={false}
              />
            );
          })()}

        {Object.entries(eventDates).map(([label, dateStr]) => {
          const bondColor = DUAL_BONDS_COLORS[label] || "grey";
          return (
            <ReferenceLine
              key={`event-${label}`}
              x={dateStr}
              stroke={bondColor}
              strokeWidth={0.75}
              strokeDasharray="dashed"
            >
              <Label
                value={label}
                position="insideTopRight"
                fill={bondColor}
                fontSize={10}
              />
            </ReferenceLine>
          );
        })}

        {scatterPoints.map((p, index) => (
          <Scatter
            key={`scatter-${p.bondTicker}-${p.scenarioLabel}-${index}`}
            name={p.bondTicker}
            data={[
              chartData.find(
                (d) =>
                  d.date === p.date &&
                  p.value !== undefined &&
                  d[p.scenarioLabel] === p.value,
              ),
            ]}
            fill={p.color}
            shape="circle"
          >
            {/* eslint-disable @typescript-eslint/no-explicit-any */}
            <LabelList
              dataKey={p.scenarioLabel}
              position="top"
              content={(props: any) => {
                const { x, y, value: pointValue } = props;
                if (pointValue === undefined) return null;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={-8}
                    fill={p.color}
                    stroke="#FFF"
                    strokeWidth={0.3}
                    fontSize={9}
                    textAnchor="middle"
                    fontWeight="bold"
                  >{`${(pointValue * 100).toFixed(1)}%`}</text>
                );
              }}
            />
          </Scatter>
        ))}
      </LineChart>
    </ChartContainer>
  );
};
