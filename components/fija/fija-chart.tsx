"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/utils";
import { FijaTableRow } from "@/types/fija";
import {
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";

interface FijaChartProps {
  data: FijaTableRow[];
}

const chartConfig = {
  tem: {
    label: "TEM",
    color: "hsl(var(--primary))",
  },
  trendline: {
    label: "Tendencia",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function calculatePolynomialRegression(
  data: { dias: number; tem: number }[],
  degree: number,
) {
  const n = data.length;
  const x = data.map((d) => d.dias);
  const y = data.map((d) => d.tem);

  const matrix: number[][] = [];
  const vector: number[] = [];

  for (let i = 0; i <= degree; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += Math.pow(x[k], i + j);
      }
      row.push(sum);
    }
    matrix.push(row);

    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += y[k] * Math.pow(x[k], i);
    }
    vector.push(sum);
  }

  const coefficients = solveLinearSystem(matrix, vector);
  return coefficients;
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [...row, vector[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  const solution = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= augmented[i][j] * solution[j];
    }
    solution[i] /= augmented[i][i];
  }

  return solution;
}

export default function FijaChart({ data }: FijaChartProps) {
  const chartData = data
    .filter(
      (row) =>
        row.px > 0 &&
        row.tem > 0 &&
        row.tna < 1 &&
        !row.ticker.startsWith("TT"),
    ) // filtrar duales
    .map((row) => ({
      dias: row.dias,
      tem: row.tem * 100,
      ticker: row.ticker,
      px: row.px,
      tna: row.tna * 100,
      tea: row.tea * 100,
    }));

  const coefficients = calculatePolynomialRegression(chartData, 2);

  const minDias = Math.min(...chartData.map((d) => d.dias));
  const maxDias = Math.max(...chartData.map((d) => d.dias));

  const trendlineData: { dias: number; tem: number }[] = [];
  for (let dias = minDias; dias <= maxDias; dias += (maxDias - minDias) / 100) {
    const tem =
      coefficients[0] + coefficients[1] * dias + coefficients[2] * dias * dias;
    trendlineData.push({ dias, tem });
  }

  const combinedData = chartData.map((point) => {
    const trendPoint = trendlineData.find(
      (t) => Math.abs(t.dias - point.dias) < 1,
    ) || {
      tem:
        coefficients[0] +
        coefficients[1] * point.dias +
        coefficients[2] * point.dias * point.dias,
    };
    return {
      ...point,
      trendline: trendPoint.tem,
    };
  });

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ComposedChart
        accessibilityLayer
        data={combinedData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: -10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="dias"
          name="Días"
          tickFormatter={(value) => value.toString()}
          domain={["dataMin-10", "dataMax+5"]}
        />
        <YAxis
          type="number"
          dataKey="tem"
          name="TEM"
          tickFormatter={(value) => `${formatNumber(value, 2)}%`}
          domain={["dataMin-0.5", "dataMax+0.5"]}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Ticker
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data.ticker}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Días
                      </span>
                      <span className="font-bold">{data.dias}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        TEM
                      </span>
                      <span className="font-bold text-foreground">
                        {formatNumber(data.tem, 2)}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Precio
                      </span>
                      <span className="font-bold">
                        {formatNumber(data.px, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="trendline"
          stroke="var(--color-trendline)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Scatter dataKey="tem" fill="var(--color-tem)">
          <LabelList dataKey="ticker" position="bottom" />
        </Scatter>
      </ComposedChart>
    </ChartContainer>
  );
}
