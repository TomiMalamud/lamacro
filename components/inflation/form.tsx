"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NumericInput } from "@/components/numeric-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import {
  calculateInflation,
  getMonthName,
  InflationRates,
} from "@/lib/inflation";
import { InflationChart } from "./inflation-chart";
import { InflationResult } from "./result";
import { ShareCalculationDialog } from "./share-calculation-dialog";
import NumberFlow from "@number-flow/react";

interface ResponsiveSelectProps {
  value: number;
  onValueChange: (value: number) => void;
  options: { value: number; label: string }[];
  placeholder: string;
  isMobile: boolean;
}

function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  isMobile,
}: ResponsiveSelectProps) {
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Select
        value={value.toString()}
        onValueChange={(val) => onValueChange(parseInt(val))}
      >
        <SelectTrigger className="w-32 dark:bg-black">
          <SelectValue placeholder={placeholder}>
            {options.find((opt) => opt.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              className="py-2 text-lg"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-32 justify-between"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setOpen(true);
            }
          }}
        >
          {options.find((opt) => opt.value === value)?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-36 p-0">
        <Command>
          <CommandInput
            placeholder={`Buscar ${placeholder.toLowerCase()}...`}
          />
          <CommandList>
            <CommandEmpty>No se encontró.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  tabIndex={0}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const handleResize = () => checkMobile();

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
                    className="pl-8 bg-white dark:bg-black font-medium"
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
                  <ResponsiveSelect
                    value={startMonth}
                    onValueChange={setStartMonth}
                    options={getValidMonthOptions(startYear)}
                    placeholder="Mes"
                    isMobile={isMobile}
                  />
                  <ResponsiveSelect
                    value={startYear}
                    onValueChange={setStartYear}
                    options={yearOptions}
                    placeholder="Año"
                    isMobile={isMobile}
                  />
                </div>
              </div>

              {/* Third row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">entonces en</span>
                <div className="flex gap-2">
                  <ResponsiveSelect
                    value={endMonth}
                    onValueChange={setEndMonth}
                    options={getValidMonthOptions(endYear)}
                    placeholder="Mes"
                    isMobile={isMobile}
                  />
                  <ResponsiveSelect
                    value={endYear}
                    onValueChange={setEndYear}
                    options={yearOptions}
                    placeholder="Año"
                    isMobile={isMobile}
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
