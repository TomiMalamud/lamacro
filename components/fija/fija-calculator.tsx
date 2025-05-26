"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FIJA_TABLE_CONFIG } from "@/lib/fija-data";
import { cn, formatNumber } from "@/lib/utils";
import { FijaTableRow } from "@/types/fija";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import InlineLink from "../inline-link";

function parseFormattedNumber(value: string): number {
  const cleanValue = value.replace(/\./g, "");
  const parsed = parseInt(cleanValue, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function formatNumberInput(value: number): string {
  return value.toLocaleString("es-AR");
}

function validateNominales(value: string): {
  isValid: boolean;
  error?: string;
} {
  if (value === "") return { isValid: true };
  const cleanValue = value.replace(/\./g, "");
  const numericValue = parseInt(cleanValue, 10);
  if (isNaN(numericValue)) {
    return { isValid: false, error: "Debe ser un número entero" };
  }
  if (numericValue < 0) {
    return { isValid: false, error: "Debe ser un número positivo" };
  }
  return { isValid: true };
}

function validateCaucho(value: string): { isValid: boolean; error?: string } {
  if (value === "") return { isValid: true };
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return { isValid: false, error: "Debe ser un número válido" };
  }
  if (numericValue < 0) {
    return { isValid: false, error: "Debe ser un número positivo" };
  }
  if (numericValue >= 100) {
    return { isValid: false, error: "Debe ser menor a 100" };
  }
  const decimalParts = value.split(".");
  if (decimalParts.length > 1 && decimalParts[1].length > 3) {
    return { isValid: false, error: "Máximo 3 decimales" };
  }
  return { isValid: true };
}

export default function FijaCalculator({
  tableData,
}: {
  tableData: FijaTableRow[];
}) {
  const [nominales, setNominales] = useState(100000);
  const [nominalesDisplay, setNominalesDisplay] = useState("100.000");
  const [nominalesError, setNominalesError] = useState<string | undefined>();

  const [selectedTicker, setSelectedTicker] = useState("");

  const [cauchoDisplay, setCauchoDisplay] = useState("23");
  const [caucho, setCaucho] = useState(23);
  const [cauchoError, setCauchoError] = useState<string | undefined>();

  const [open, setOpen] = useState(false);

  const handleNominalesChange = (value: string) => {
    setNominalesDisplay(value);
    const validation = validateNominales(value);

    if (validation.isValid) {
      setNominalesError(undefined);
      if (value === "") {
        setNominales(0);
      } else {
        const numericValue = parseFormattedNumber(value);
        setNominales(numericValue);
        setNominalesDisplay(formatNumberInput(numericValue));
      }
    } else {
      setNominalesError(validation.error);
    }
  };

  const handleCauchoChange = (value: string) => {
    setCauchoDisplay(value);
    const validation = validateCaucho(value);

    if (validation.isValid) {
      setCauchoError(undefined);
      if (value === "") {
        setCaucho(0);
      } else {
        const numericValue = parseFloat(value);
        setCaucho(numericValue);
      }
    } else {
      setCauchoError(validation.error);
    }
  };

  const calculations = useMemo(() => {
    if (!selectedTicker || nominalesError || cauchoError || nominales === 0)
      return null;

    const selectedData = tableData.find((row) => row.ticker === selectedTicker);
    const configData = FIJA_TABLE_CONFIG.find(
      (config) => config.ticker === selectedTicker,
    );

    if (!selectedData || !configData) return null;

    const precio = selectedData.px;
    const pesosIniciales = (nominales * precio) / 100;
    const alVencimiento = (configData.pagoFinal * nominales) / 100;
    const montoCaucho =
      pesosIniciales * Math.pow(1 + caucho / 100 / 365, selectedData.dias);

    const diferenciaGanancia = alVencimiento - montoCaucho;
    const porDia = diferenciaGanancia / selectedData.dias;
    const tasaGanancia = diferenciaGanancia / pesosIniciales;
    const tea = selectedData.tea;
    const teaCaucho =
      Math.pow(montoCaucho / pesosIniciales, 365 / selectedData.dias) - 1;

    return {
      precio,
      pesosIniciales,
      alVencimiento,
      montoCaucho,
      diferenciaGanancia,
      porDia,
      tasaGanancia,
      tea,
      teaCaucho,
      dias: selectedData.dias,
    };
  }, [
    selectedTicker,
    nominales,
    caucho,
    tableData,
    nominalesError,
    cauchoError,
  ]);

  const tickerOptions = tableData
    .filter((row) => row.px > 0)
    .map((row) => ({
      value: row.ticker,
      label: `${row.ticker} - ${row.fechaVencimiento} (${row.dias}d)`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Renta Fija</CardTitle>
        <CardDescription>
          Compará rendimientos de instrumentos de renta fija con otras
          alternativas de tasa. Puede ser caucho (caución) o instrumentos
          listados en{" "}
          <InlineLink href="https://comparatasas.ar">
            Comparatasas.ar
          </InlineLink>
          , como Mercado Pago, Ualá, Cocos, Plazos Fijos, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ticker</Label>
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between dark:bg-neutral-900 sm:hidden"
                >
                  {selectedTicker
                    ? tickerOptions.find(
                        (option) => option.value === selectedTicker,
                      )?.label
                    : "Seleccionar ticker..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[80vh] pb-16">
                <DrawerHeader>
                  <DrawerTitle>Seleccionar Ticker</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto">
                  <div className="space-y-2">
                    {tickerOptions.map((option) => (
                      <DrawerClose asChild key={option.value}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 text-left"
                          onClick={() => {
                            setSelectedTicker(option.value);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTicker === option.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="text-sm">{option.label}</span>
                        </Button>
                      </DrawerClose>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between dark:bg-neutral-900 hidden sm:flex"
                >
                  {selectedTicker
                    ? tickerOptions.find(
                        (option) => option.value === selectedTicker,
                      )?.label
                    : "Seleccionar ticker..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar ticker..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el ticker.</CommandEmpty>
                    <CommandGroup>
                      {tickerOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            setSelectedTicker(option.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTicker === option.value
                                ? "opacity-100"
                                : "opacity-0",
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="nominales">Nominales</Label>
            <Input
              id="nominales"
              type="text"
              value={nominalesDisplay}
              onChange={(e) => handleNominalesChange(e.target.value)}
              className={cn(
                "dark:bg-neutral-900",
                nominalesError && "border-red-500",
              )}
              placeholder="Ej: 100.000"
            />
            {nominalesError && (
              <p className="text-sm text-red-500">{nominalesError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caucho">Alternativa (TNA %)</Label>
            <Input
              id="caucho"
              type="text"
              value={cauchoDisplay}
              onChange={(e) => handleCauchoChange(e.target.value)}
              className={cn(
                "dark:bg-neutral-900",
                cauchoError && "border-red-500",
              )}
              placeholder="Ej: 23"
            />
            {cauchoError && (
              <p className="text-sm text-red-500">{cauchoError}</p>
            )}
          </div>
        </div>

        {calculations && (
          <div className="space-y-6 border-t pt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Variables de Cálculo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Precio {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    {formatNumber(calculations.precio)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Pesos Iniciales
                  </Label>
                  <div className="text-lg font-medium">
                    ${formatNumber(calculations.pesosIniciales)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    {selectedTicker} Al Vencimiento
                  </Label>
                  <div className="text-lg font-medium">
                    ${formatNumber(calculations.alVencimiento)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Monto Caucho
                  </Label>
                  <div className="text-lg font-medium">
                    ${formatNumber(calculations.montoCaucho)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resultados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Diferencia en Ganancia
                  </Label>
                  <div
                    className={`text-lg font-medium ${
                      calculations.diferenciaGanancia >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${formatNumber(calculations.diferenciaGanancia)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Por Día
                  </Label>
                  <div
                    className={`text-lg font-medium ${
                      calculations.porDia >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${formatNumber(calculations.porDia)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Tasa Ganancia
                  </Label>
                  <div
                    className={`text-lg font-medium ${
                      calculations.tasaGanancia >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatNumber(calculations.tasaGanancia, 2, "percentage")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    TEA Instrumento
                  </Label>
                  <div className="text-lg font-medium">
                    {formatNumber(calculations.tea, 2, "percentage")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    TEA Caucho
                  </Label>
                  <div className="text-lg font-medium">
                    {formatNumber(calculations.teaCaucho, 2, "percentage")}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-base">
                {calculations.diferenciaGanancia >= 0 ? (
                  <span className="text-green-600 font-medium">
                    El caucho rinde $
                    {formatNumber(Math.abs(calculations.diferenciaGanancia))}{" "}
                    más que el instrumento
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    El instrumento rinde $
                    {formatNumber(Math.abs(calculations.diferenciaGanancia))}{" "}
                    más que el caucho
                  </span>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  en {calculations.dias} días
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
