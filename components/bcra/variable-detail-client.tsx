"use client";

import {
    BCRAVariable,
    formatMonetaryValue,
    formatNumber
} from "@/lib/bcra-api";
import { useState } from "react";
import { VariableTimeSeriesChart } from "./variable-time-series-chart";

export function VariableDetailClient({
  initialValue,
  variableDescription,
  initialData,
  variableId
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
        <div className="text-3xl font-bold">
          {formatMonetaryValue(initialValue, variableDescription)}
        </div>
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
