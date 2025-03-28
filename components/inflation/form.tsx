"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ShareCalculationDialog } from "../share-calculation-dialog";
import { Card, CardContent, CardFooter } from "../ui/card";
import InflationCalculator, { getMonthName, InflationResult as InflationResultType } from "./calculator";
import { InflationChart } from "./inflation-chart";
import { InflationResult } from "./result";

interface InflationFormProps {
  defaultStartMonth?: number;
  defaultStartYear?: number;
  defaultStartValue?: number;
  defaultEndMonth?: number;
  defaultEndYear?: number;
}

interface ResponsiveSelectProps {
  value: number;
  onValueChange: (value: number) => void;
  options: { value: number; label: string }[];
  placeholder: string;
  isMobile: boolean;
}

function ResponsiveSelect({ value, onValueChange, options, placeholder, isMobile }: ResponsiveSelectProps) {
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Select value={value.toString()} onValueChange={(val) => onValueChange(parseInt(val))}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder={placeholder}>
            {options.find((opt) => opt.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
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
            if (e.key === 'Enter' || e.key === ' ') {
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
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
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
                      value === option.value ? "opacity-100" : "opacity-0"
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

export function InflationForm({
  defaultStartMonth = new Date().getMonth() + 1,
  defaultStartYear = new Date().getFullYear() - 1,
  defaultStartValue = 1000,
  defaultEndMonth = new Date().getMonth() + 1,
  defaultEndYear = new Date().getFullYear(),
}: InflationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startMonth, setStartMonth] = useState<number>(defaultStartMonth);
  const [startYear, setStartYear] = useState<number>(defaultStartYear);
  const [startValue, setStartValue] = useState<number>(defaultStartValue);
  const [endMonth, setEndMonth] = useState<number>(defaultEndMonth);
  const [endYear, setEndYear] = useState<number>(defaultEndYear);
  const [result, setResult] = useState<InflationResultType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update URL when values change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("startMonth", startMonth.toString());
    params.set("startYear", startYear.toString());
    params.set("startValue", startValue.toString());
    params.set("endMonth", endMonth.toString());
    params.set("endYear", endYear.toString());
    router.replace(`/inflation-calculator?${params.toString()}`);
  }, [startMonth, startYear, startValue, endMonth, endYear, router, searchParams]);

  // Calculate results whenever any input changes
  useEffect(() => {
    const calculationResult = InflationCalculator({
      startMonth,
      startYear,
      startValue,
      endMonth,
      endYear
    });
    setResult(calculationResult);
  }, [startMonth, startYear, startValue, endMonth, endYear]);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));

  // Generate year options (from current year to 2000, descending)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1991 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString(),
  }));

  return (
    <>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-lg">
              {/* First row */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <span className="text-muted-foreground">Si compré algo a</span>
                <div className="relative w-48">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={startValue}
                    onChange={(e) => setStartValue(parseFloat(e.target.value))}
                    className="pl-8 bg-white dark:bg-black font-medium"
                    required
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
                    options={monthOptions}
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
                    options={monthOptions}
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

              {result && (
                <div className="border-t flex flex-col md:flex-row pt-4 items-center gap-2 font-medium">
                  <span className="text-muted-foreground">ese mismo ítem valdría</span>
                  <span className="text-xl font-bold">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS'
                    }).format(result.endValue)}
                  </span>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-8">
                <InflationResult {...result} />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pb-4">
          <ShareCalculationDialog />
        </CardFooter>
      </Card>
      {result && (
        <InflationChart
          startMonth={startMonth}
          startYear={startYear}
          startValue={startValue}
          endMonth={endMonth}
          endYear={endYear}
        />
      )}
    </>
  );
} 