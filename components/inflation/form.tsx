"use client";

import { NumericInput } from "@/components/numeric-input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  calculateInflation,
  getFirstMissingInflationMonthInRange,
  getMonthName,
  InflationRates,
} from "@/lib/inflation";
import NumberFlow from "@number-flow/react";
import { parseAsFloat, parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { InflationChart } from "./inflation-chart";
import { InflationResult } from "./result";
import { ShareCalculationDialog } from "./share-calculation-dialog";

interface InflationFormProps {
  inflationData: InflationRates;
}

interface YearMonth {
  year: number;
  month: number;
}

interface InflationAvailability {
  yearsDesc: number[];
  endYearsDesc: number[];
  monthsByYear: Record<number, number[]>;
  endMonthsByYear: Record<number, number[]>;
  availableDatesAsc: YearMonth[];
  endSelectableDatesAsc: YearMonth[];
  maxEndDate: YearMonth;
}

function compareYearMonth(a: YearMonth, b: YearMonth): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

function buildInflationAvailability(
  inflationData: InflationRates,
): InflationAvailability {
  const yearsAsc = Object.keys(inflationData)
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year))
    .sort((a, b) => a - b);

  const monthsByYear: Record<number, number[]> = {};
  const availableDatesAsc: YearMonth[] = [];

  yearsAsc.forEach((year) => {
    const months = Object.keys(inflationData[year.toString()] || {})
      .map((month) => Number(month))
      .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
      .sort((a, b) => a - b);

    if (months.length === 0) return;

    monthsByYear[year] = months;
    months.forEach((month) => {
      availableDatesAsc.push({ year, month });
    });
  });

  if (availableDatesAsc.length === 0) {
    throw new Error("Inflation data is empty");
  }

  const yearsDesc = Object.keys(monthsByYear)
    .map((year) => Number(year))
    .sort((a, b) => b - a);

  const nextMonthAfterLastDate: YearMonth =
    availableDatesAsc[availableDatesAsc.length - 1].month === 12
      ? {
          year: availableDatesAsc[availableDatesAsc.length - 1].year + 1,
          month: 1,
        }
      : {
          year: availableDatesAsc[availableDatesAsc.length - 1].year,
          month: availableDatesAsc[availableDatesAsc.length - 1].month + 1,
        };

  const endMonthsByYear: Record<number, number[]> = Object.fromEntries(
    Object.entries(monthsByYear).map(([year, months]) => [year, [...months]]),
  );
  const endYearMonths = endMonthsByYear[nextMonthAfterLastDate.year] || [];
  if (!endYearMonths.includes(nextMonthAfterLastDate.month)) {
    endYearMonths.push(nextMonthAfterLastDate.month);
    endYearMonths.sort((a, b) => a - b);
  }
  endMonthsByYear[nextMonthAfterLastDate.year] = endYearMonths;

  const endYearsDesc = Object.keys(endMonthsByYear)
    .map((year) => Number(year))
    .sort((a, b) => b - a);

  const endSelectableDatesAsc = [...availableDatesAsc, nextMonthAfterLastDate];

  return {
    yearsDesc,
    endYearsDesc,
    monthsByYear,
    endMonthsByYear,
    availableDatesAsc,
    endSelectableDatesAsc,
    maxEndDate: nextMonthAfterLastDate,
  };
}

function findLatestAvailableOnOrBefore(
  target: YearMonth,
  availableDatesAsc: YearMonth[],
): YearMonth {
  for (let index = availableDatesAsc.length - 1; index >= 0; index--) {
    if (compareYearMonth(availableDatesAsc[index], target) <= 0) {
      return availableDatesAsc[index];
    }
  }

  return availableDatesAsc[0];
}

function findPreviousAvailableDate(
  target: YearMonth,
  availableDatesAsc: YearMonth[],
): YearMonth | null {
  for (let index = availableDatesAsc.length - 1; index >= 0; index--) {
    if (compareYearMonth(availableDatesAsc[index], target) < 0) {
      return availableDatesAsc[index];
    }
  }

  return null;
}

function coerceMonthForYear(
  year: number,
  preferredMonth: number,
  monthsByYear: Record<number, number[]>,
): number | null {
  const months = monthsByYear[year];
  if (!months || months.length === 0) return null;
  if (months.includes(preferredMonth)) return preferredMonth;

  for (let index = months.length - 1; index >= 0; index--) {
    if (months[index] < preferredMonth) {
      return months[index];
    }
  }

  return months[0];
}

export function InflationForm({ inflationData }: InflationFormProps) {
  const availability = useMemo(
    () => buildInflationAvailability(inflationData),
    [inflationData],
  );

  const defaultValues = useMemo(() => {
    const end = availability.maxEndDate;
    const start =
      findPreviousAvailableDate(end, availability.availableDatesAsc) ??
      availability.availableDatesAsc[0];

    return {
      start,
      end,
      startValue: 1000,
    };
  }, [availability]);

  const [queryStartMonth, setStartMonth] = useQueryState(
    "startMonth",
    parseAsInteger.withDefault(defaultValues.start.month),
  );
  const [queryStartYear, setStartYear] = useQueryState(
    "startYear",
    parseAsInteger.withDefault(defaultValues.start.year),
  );
  const [queryStartValue, setStartValue] = useQueryState(
    "startValue",
    parseAsFloat.withDefault(defaultValues.startValue),
  );
  const [queryEndMonth, setEndMonth] = useQueryState(
    "endMonth",
    parseAsInteger.withDefault(defaultValues.end.month),
  );
  const [queryEndYear, setEndYear] = useQueryState(
    "endYear",
    parseAsInteger.withDefault(defaultValues.end.year),
  );

  const startDate = useMemo(
    () =>
      findLatestAvailableOnOrBefore(
        { year: queryStartYear, month: queryStartMonth },
        availability.availableDatesAsc,
      ),
    [queryStartYear, queryStartMonth, availability],
  );

  const endDate = useMemo(
    () =>
      findLatestAvailableOnOrBefore(
        { year: queryEndYear, month: queryEndMonth },
        availability.endSelectableDatesAsc,
      ),
    [queryEndYear, queryEndMonth, availability],
  );

  const startMonth = startDate.month;
  const startYear = startDate.year;
  const startValue = Math.max(0, queryStartValue);
  const endMonth = endDate.month;
  const endYear = endDate.year;

  const handleStartYearChange = (year: number) => {
    setStartYear(year);
    const validMonth = coerceMonthForYear(
      year,
      startMonth,
      availability.monthsByYear,
    );
    if (validMonth !== null && validMonth !== startMonth) {
      setStartMonth(validMonth);
    }
  };

  const handleEndYearChange = (year: number) => {
    setEndYear(year);
    const validMonth = coerceMonthForYear(
      year,
      endMonth,
      availability.endMonthsByYear,
    );
    if (validMonth !== null && validMonth !== endMonth) {
      setEndMonth(validMonth);
    }
  };

  const hasInvalidDateRange =
    compareYearMonth(
      { year: startYear, month: startMonth },
      { year: endYear, month: endMonth },
    ) >= 0;

  const yearOptions = useMemo(
    () =>
      availability.yearsDesc.map((year) => ({
        value: year,
        label: year.toString(),
      })),
    [availability],
  );

  const endYearOptions = useMemo(
    () =>
      availability.endYearsDesc.map((year) => ({
        value: year,
        label: year.toString(),
      })),
    [availability],
  );

  const getValidStartMonthOptions = (year: number) =>
    (availability.monthsByYear[year] || []).map((month) => ({
      value: month,
      label: getMonthName(month),
    }));

  const getValidEndMonthOptions = (year: number) =>
    (availability.endMonthsByYear[year] || []).map((month) => ({
      value: month,
      label: getMonthName(month),
    }));

  // Calculate error and result with useMemo
  const error = useMemo(() => {
    if (
      compareYearMonth(
        { year: endYear, month: endMonth },
        availability.maxEndDate,
      ) > 0
    ) {
      return "La fecha final seleccionada no tiene datos de inflación";
    }

    const missingMonth = getFirstMissingInflationMonthInRange(
      startMonth,
      startYear,
      endMonth,
      endYear,
      inflationData,
    );
    if (missingMonth) {
      return `Faltan datos de inflación para ${getMonthName(missingMonth.month)} ${missingMonth.year}`;
    }

    return null;
  }, [startMonth, startYear, endMonth, endYear, inflationData, availability]);

  const result = useMemo(() => {
    if (error || hasInvalidDateRange) return null;

    try {
      return calculateInflation(
        startMonth,
        startYear,
        startValue,
        endMonth,
        endYear,
        inflationData,
      );
    } catch {
      return null;
    }
  }, [
    error,
    hasInvalidDateRange,
    startMonth,
    startYear,
    startValue,
    endMonth,
    endYear,
    inflationData,
  ]);
  const visibleResult = result;

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
                  <NativeSelect
                    aria-label="Mes inicial"
                    className="w-32"
                    value={startMonth.toString()}
                    onChange={(event) =>
                      setStartMonth(Number.parseInt(event.target.value, 10))
                    }
                  >
                    {getValidStartMonthOptions(startYear).map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    aria-label="Año inicial"
                    className="w-32"
                    value={startYear.toString()}
                    onChange={(event) =>
                      handleStartYearChange(
                        Number.parseInt(event.target.value, 10),
                      )
                    }
                  >
                    {yearOptions.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Third row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">entonces en</span>
                <div className="flex gap-2">
                  <NativeSelect
                    aria-label="Mes final"
                    className="w-32"
                    value={endMonth.toString()}
                    onChange={(event) =>
                      setEndMonth(Number.parseInt(event.target.value, 10))
                    }
                  >
                    {getValidEndMonthOptions(endYear).map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    aria-label="Año final"
                    className="w-32"
                    value={endYear.toString()}
                    onChange={(event) =>
                      handleEndYearChange(
                        Number.parseInt(event.target.value, 10),
                      )
                    }
                  >
                    {endYearOptions.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {visibleResult && (
                <div className="border-t flex flex-col md:flex-row pt-4 items-center gap-2 font-medium">
                  <span className="text-muted-foreground">
                    ese mismo ítem valdría
                  </span>
                  <span className="text-xl font-bold">
                    <NumberFlow
                      value={visibleResult.endValue}
                      locales="es-AR"
                      format={{ style: "currency", currency: "ARS" }}
                    />
                  </span>
                </div>
              )}
            </div>

            {hasInvalidDateRange && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle className="font-bold">
                  La fecha inicial debe ser anterior a la final
                </AlertTitle>
              </Alert>
            )}

            {visibleResult && (
              <div className="mt-8">
                <InflationResult {...visibleResult} />
              </div>
            )}
          </div>
        </CardContent>
        {visibleResult && (
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
      {visibleResult && (
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
