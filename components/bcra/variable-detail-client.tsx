"use client";

import { BCRAVariable } from "@/lib/bcra-fetch";
import NumberFlow from "@number-flow/react";
import { useState } from "react";
import { VariableTimeSeriesChart } from "./variable-time-series-chart";
import { formatNumber } from "@/lib/utils";

export function VariableDetailClient({
  initialValue,
  initialData,
  variableId,
}: {
  initialValue: number;
  variableDescription: string;
  initialData: BCRAVariable[];
  variableId: number;
}) {
  const [percentChange, setPercentChange] = useState<number | null>(null);

  const percentValue =
    percentChange !== null ? Math.round((percentChange ?? 0) * 100) / 10000 : 0;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold">{formatNumber(initialValue)}</div>
        {percentChange !== null && (
          <NumberFlow
            value={percentValue}
            locales="es-AR"
            format={{
              style: "percent",
              maximumFractionDigits: 2,
              signDisplay: "always",
            }}
            className="text-lg"
          />
        )}
      </div>

      <div className="mt-8">
        <VariableTimeSeriesChart
          initialData={initialData}
          variableId={variableId}
          onPercentChangeUpdate={setPercentChange}
        />
      </div>
    </>
  );
}
