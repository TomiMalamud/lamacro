"use client";

import {
  type DualBondChartPoint,
  type DualBondScatterPoint,
  DUAL_BOND_EVENTS,
} from "@/lib/carry-trade";
import React from "react";
import {
  CartesianGrid,
  Label,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { chartConfig, DUAL_BONDS_COLORS } from "./constants";

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
  const tooltipFormatter = (value: number, name: string) => [
    `${(value * 100).toFixed(2)}%`,
    name
      .replace("tamar_proy_", "Proy. ")
      .replace("_AVG", " Promedio")
      .replace("tamar_tem_spot", "TEM Spot TAMAR")
      .replace("tamar_AVG", "Promedio TAMAR"),
  ];

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
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
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
          formatter={tooltipFormatter}
          labelStyle={{ color: "black" }}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "5px",
          }}
          content={<ChartTooltipContent />}
        />
        <Legend wrapperStyle={{ bottom: 0 }} />

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

        {targetsTEM.map((target) => {
          const proyAvgKey = `tamar_proy_${(target * 100).toFixed(1)}_AVG`;
          return (
            <Line
              key={proyAvgKey}
              type="monotone"
              dataKey={proyAvgKey}
              name={`Escenario TAMAR ${(target * 100).toFixed(1)}% (Promedio)`}
              stroke={DUAL_BONDS_COLORS.projection_AVG}
              strokeWidth={1}
              dot={false}
            />
          );
        })}

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
              dataKey="value"
              position="top"
              content={(props: any) => {
                const { x, y, value } = props;
                if (value === undefined) return null;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={-8}
                    fill="#333"
                    stroke="#FFF"
                    strokeWidth={0.4}
                    fontSize={8}
                    textAnchor="middle"
                  >{`${(value * 100).toFixed(2)}%`}</text>
                );
              }}
            />
            {}
          </Scatter>
        ))}
      </LineChart>
    </ChartContainer>
  );
};
