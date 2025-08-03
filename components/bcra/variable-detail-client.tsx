"use client";

import { BCRAVariable } from "@/lib/bcra-fetch";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";
import { VariableTimeSeriesChart } from "./variable-time-series-chart";

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

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold">{formatNumber(initialValue)}</div>
        {percentChange !== null && (
          <span>
            {percentChange > 0
              ? `+${formatNumber(percentChange, 2)}%`
              : `${formatNumber(percentChange, 2)}%`}
          </span>
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
