"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { MepBreakevenChart } from "./mep-breakeven-chart";
import { getCurrentUpperLimit } from "@/lib/carry-trade"
import { NumericInput } from "../numeric-input";
import type { NumberFormatValues } from "react-number-format";
import type { ProcessedBondData } from "@/types/carry-trade";

interface MepBreakevenProps {
  data: ProcessedBondData[];
}

const CARRY_PRICES = [1000, 1100, 1200, 1300, 1400];

function recalculateWithCustomMep(
  data: ProcessedBondData[],
  customMep: number,
): ProcessedBondData[] {
  const current = getCurrentUpperLimit();
  return data.map((bond) => {
    const ratio = bond.payoff / bond.bond_price;
    const mep_breakeven = customMep * ratio;
    const finish_worst = Math.round(
      current * Math.pow(1.01, bond.days_to_exp / 30),
    );
    const carry_worst = (ratio * customMep) / finish_worst - 1;
    const carry_mep = ratio - 1;

    const carries: Record<string, number> = {};
    CARRY_PRICES.forEach((price) => {
      carries[`carry_${price}`] = (ratio * customMep) / price - 1;
    });

    return {
      ...bond,
      mep_breakeven,
      carry_worst,
      carry_mep,
      ...carries,
    };
  });
}

export function MepBreakeven({ data }: MepBreakevenProps) {
  const [customMep, setCustomMep] = useState<number | undefined>();

  const chartData = useMemo(() => {
    if (!customMep) return data;
    return recalculateWithCustomMep(data, customMep);
  }, [data, customMep]);

  const handleMepChange = useDebouncedCallback((value: string) => {
    const numericValue = parseFloat(value);
    if (value === "" || isNaN(numericValue)) {
      setCustomMep(undefined);
    } else {
      setCustomMep(numericValue);
    }
  }, 300);

  return (
    <>
      <div className="flex items-center gap-2 pt-4">
        <span className="text-blue-500 text-xs">
          Ingresá un valor del dólar personalizado:
        </span>
        <NumericInput
          className="w-full max-w-xs"
          placeholder="Ingresá un valor de dólar"
          onValueChange={(values) => {
            handleMepChange(values.value || "");
          }}
          isAllowed={(values: NumberFormatValues): boolean => {
            const numericValue = parseFloat(values.value || "0");
            return !isNaN(numericValue) && numericValue <= 5000;
          }}
          prefix="$"
        />
      </div>
      <MepBreakevenChart data={chartData} />
    </>
  );
}
