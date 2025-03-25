"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMonthName } from "./calculator";
import InflationCalculator, { InflationResult as InflationResultType } from "./calculator";
import { InflationResult } from "./result";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InflationFormProps {
  defaultStartMonth?: number;
  defaultStartYear?: number;
  defaultStartValue?: number;
  defaultEndMonth?: number;
  defaultEndYear?: number;
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
  const [openStartMonth, setOpenStartMonth] = useState(false);
  const [openStartYear, setOpenStartYear] = useState(false);
  const [openEndMonth, setOpenEndMonth] = useState(false);
  const [openEndYear, setOpenEndYear] = useState(false);
  const [result, setResult] = useState<InflationResultType | null>(null);

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
            <Popover open={openStartMonth} onOpenChange={setOpenStartMonth}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStartMonth}
                  className="w-32 justify-between"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setOpenStartMonth(true);
                    }
                  }}
                >
                  {monthOptions.find((month) => month.value === startMonth)?.label ?? "Mes"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-36 p-0">
                <Command>
                  <CommandInput placeholder="Buscar mes..." />
                  <CommandList>
                  <CommandEmpty>No se encontró el mes.</CommandEmpty>
                  <CommandGroup>
                    {monthOptions.map((month) => (
                      <CommandItem
                        key={month.value}
                        value={month.label}
                        onSelect={() => {
                          setStartMonth(month.value as number);
                          setOpenStartMonth(false);
                        }}
                        tabIndex={0}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            startMonth === month.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {month.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Popover open={openStartYear} onOpenChange={setOpenStartYear}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStartYear}
                  className="w-28 justify-between"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setOpenStartYear(true);
                    }
                  }}
                >
                  {startYear}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-36 p-0">
                <Command filter={(value, search) => {
                  return value.startsWith(search) ? 1 : 0;
                }}>
                  <CommandInput placeholder="Buscar año..." />
                  <CommandList>
                  <CommandEmpty>No se encontró el año.</CommandEmpty>
                  <CommandGroup>
                    {yearOptions.map((year) => (
                      <CommandItem
                        key={year.value}
                        value={year.value.toString()}
                        onSelect={() => {
                          setStartYear(year.value as number);
                          setOpenStartYear(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            startYear === year.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {year.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Third row */}
        <div className="flex flex-col md:flex-row items-center gap-2">
          <span className="text-muted-foreground">entonces en</span>
          <div className="flex gap-2">
            <Popover open={openEndMonth} onOpenChange={setOpenEndMonth}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEndMonth}
                  className="w-32 justify-between"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setOpenEndMonth(true);
                    }
                  }}
                >
                  {monthOptions.find((month) => month.value === endMonth)?.label ?? "Mes"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-36 p-0">
                <Command>
                  <CommandInput placeholder="Buscar mes..." />
                  <CommandList>
                  <CommandEmpty>No se encontró el mes.</CommandEmpty>
                  <CommandGroup>
                    {monthOptions.map((month) => (
                      <CommandItem
                        key={month.value}
                        value={month.label}
                        onSelect={() => {
                          setEndMonth(month.value as number);
                          setOpenEndMonth(false);
                        }}
                        tabIndex={0}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            endMonth === month.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {month.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Popover open={openEndYear} onOpenChange={setOpenEndYear}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEndYear}
                  className="w-28 justify-between"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setOpenEndYear(true);
                    }
                  }}
                >
                  {endYear}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-36 p-0">
                <Command filter={(value, search) => {
                  return value.startsWith(search) ? 1 : 0;
                }}>
                  <CommandInput placeholder="Buscar año..." />
                  <CommandList>
                  <CommandEmpty>No se encontró el año.</CommandEmpty>
                  <CommandGroup>
                    {yearOptions.map((year) => (
                      <CommandItem
                        key={year.value}
                        value={year.value.toString()}
                        onSelect={() => {
                          setEndYear(year.value as number);
                          setOpenEndYear(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            endYear === year.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {year.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
  );
} 