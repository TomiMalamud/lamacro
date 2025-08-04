"use client";

import { NumericInput } from "@/components/numeric-input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ComboboxDrawer } from "@/components/ui/combobox-drawer";
import {
  calculateInflation,
  getMonthName,
  InflationRates,
} from "@/lib/inflation";
import NumberFlow from "@number-flow/react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { InflationChart } from "./inflation-chart";
import { InflationResult } from "./result";
import { ShareCalculationDialog } from "./share-calculation-dialog";

interface InflationFormProps {
  inflationData: InflationRates;
}

export function InflationForm({ inflationData }: InflationFormProps) {
  const searchParams = useSearchParams();

  const getDefaultValue = (param: string, fallback: number) => {
    const value = searchParams.get(param);
    return value
      ? param === "startValue"
        ? parseFloat(value)
        : parseInt(value)
      : fallback;
  };

  const [startMonth, setStartMonth] = useState<number>(() =>
    getDefaultValue("startMonth", new Date().getMonth() + 1),
  );
  const [startYear, setStartYear] = useState<number>(() =>
    getDefaultValue("startYear", new Date().getFullYear() - 1),
  );
  const [startValue, setStartValue] = useState<number>(() =>
    getDefaultValue("startValue", 1000),
  );
  const [endMonth, setEndMonth] = useState<number>(() =>
    getDefaultValue("endMonth", new Date().getMonth() + 1),
  );
  const [endYear, setEndYear] = useState<number>(() =>
    getDefaultValue("endYear", new Date().getFullYear()),
  );

  // Track previous values for state adjustment
  const [prevEndValues, setPrevEndValues] = useState({ endYear, endMonth });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Generate year options (from current year to 1992, descending)
  const yearOptions = Array.from({ length: currentYear - 1991 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString(),
  }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));

  const getValidMonthOptions = (year: number) => {
    let months = monthOptions; // Use the predefined monthOptions
    if (year === currentYear) {
      months = months.filter((month) => month.value <= currentMonth);
    }
    return months;
  };

  // Adjust start date if it's after end date (during render)
  let adjustedStartYear = startYear;
  let adjustedStartMonth = startMonth;

  const startDate = new Date(startYear, startMonth - 1);
  const endDate = new Date(endYear, endMonth - 1);

  if (startDate > endDate) {
    adjustedStartYear = endYear;
    adjustedStartMonth = endMonth;

    // Update state if end values changed
    if (
      prevEndValues.endYear !== endYear ||
      prevEndValues.endMonth !== endMonth
    ) {
      setPrevEndValues({ endYear, endMonth });
      // Schedule state updates
      Promise.resolve().then(() => {
        setStartYear(endYear);
        setStartMonth(endMonth);
      });
    }
  }

  // Calculate error and result with useMemo
  const error = useMemo(() => {
    if (
      endYear > currentYear ||
      (endYear === currentYear && endMonth > currentMonth)
    ) {
      return "La fecha final no puede ser en el futuro";
    }
    return null;
  }, [endYear, endMonth, currentYear, currentMonth]);

  const result = useMemo(() => {
    if (error) return null;

    return calculateInflation(
      adjustedStartMonth,
      adjustedStartYear,
      startValue,
      endMonth,
      endYear,
      inflationData,
    );
  }, [
    error,
    adjustedStartMonth,
    adjustedStartYear,
    startValue,
    endMonth,
    endYear,
    inflationData,
  ]);

  return (
    <>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="space-y-6">
            {error && (
              <div className="text-red-500 font-medium text-sm">{error}</div>
            )}
            <div className="flex flex-col items-center gap-4 text-lg">
              {/* First row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">Si compré algo a</span>
                <div className="relative w-48">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                    $
                  </span>
                  <NumericInput
                    value={startValue}
                    onValueChange={(values) =>
                      setStartValue(values.floatValue || 0)
                    }
                    className="pl-8"
                    placeholder="0"
                    allowNegative={false}
                    decimalScale={2}
                    tabIndex={0}
                    aria-label="Valor inicial"
                  />
                </div>
              </div>

              {/* Second row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">en</span>
                <div className="flex gap-2">
                  <ComboboxDrawer
                    value={startMonth}
                    onValueChange={setStartMonth}
                    options={getValidMonthOptions(startYear)}
                    placeholder="Mes"
                    className="w-32"
                  />
                  <ComboboxDrawer
                    value={startYear}
                    onValueChange={setStartYear}
                    options={yearOptions}
                    placeholder="Año"
                    className="w-32"
                  />
                </div>
              </div>

              {/* Third row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">entonces en</span>
                <div className="flex gap-2">
                  <ComboboxDrawer
                    value={endMonth}
                    onValueChange={setEndMonth}
                    options={getValidMonthOptions(endYear)}
                    placeholder="Mes"
                    className="w-32"
                  />
                  <ComboboxDrawer
                    value={endYear}
                    onValueChange={setEndYear}
                    options={yearOptions}
                    placeholder="Año"
                    className="w-32"
                  />
                </div>
              </div>

              {result && result.totalIncrement > 0 && (
                <div className="border-t flex flex-col md:flex-row pt-4 items-center gap-2 font-medium">
                  <span className="text-muted-foreground">
                    ese mismo ítem valdría
                  </span>
                  <span className="text-xl font-bold">
                    <NumberFlow
                      value={result.endValue}
                      locales="es-AR"
                      format={{ style: "currency", currency: "ARS" }}
                    />
                  </span>
                </div>
              )}
            </div>

            {result && result.totalIncrement <= 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle className="font-bold">
                  La fecha inicial debe ser anterior a la final
                </AlertTitle>
              </Alert>
            )}

            {result && result.totalIncrement > 0 && (
              <div className="mt-8">
                <InflationResult {...result} />
              </div>
            )}
          </div>
        </CardContent>
        {result && result.totalIncrement > 0 && (
          <CardFooter className="flex justify-center pb-4">
            <ShareCalculationDialog
              startMonth={startMonth}
              startYear={startYear}
              startValue={startValue}
              endMonth={endMonth}
              endYear={endYear}
            />
          </CardFooter>
        )}
      </Card>
      {result && result.totalIncrement > 0 && (
        <InflationChart
          startMonth={startMonth}
          startYear={startYear}
          startValue={startValue}
          endMonth={endMonth}
          endYear={endYear}
          inflationData={inflationData}
        />
      )}
    </>
  );
}
