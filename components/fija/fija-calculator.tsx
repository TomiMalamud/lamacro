"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { FIJA_TABLE_CONFIG } from "@/lib/fija";
import { cn, formatNumber } from "@/lib/utils";
import { ComparatasasOption, FijaTableRow, FundData } from "@/types/fija";
import { Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
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

function validatePesosIniciales(value: string): {
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
  billeteras,
  fondos,
}: {
  tableData: FijaTableRow[];
  billeteras: ComparatasasOption[];
  fondos: FundData[];
}) {
  const [pesosIniciales, setPesosIniciales] = useState(100000);
  const [pesosInicialesDisplay, setPesosInicialesDisplay] = useState("100.000");
  const [pesosInicialesError, setPesosInicialesError] = useState<
    string | undefined
  >();

  const [selectedTicker, setSelectedTicker] = useState("");

  const [cauchoDisplay, setCauchoDisplay] = useState("23");
  const [caucho, setCaucho] = useState(23);
  const [cauchoError, setCauchoError] = useState<string | undefined>();
  const [selectedAlternative, setSelectedAlternative] = useState<string>("");
  const [isCustomAlternative, setIsCustomAlternative] = useState(false);

  const [open, setOpen] = useState(false);
  const [alternativeOpen, setAlternativeOpen] = useState(false);

  const handlePesosInicialesChange = (value: string) => {
    setPesosInicialesDisplay(value);
    const validation = validatePesosIniciales(value);

    if (validation.isValid) {
      setPesosInicialesError(undefined);
      if (value === "") {
        setPesosIniciales(0);
      } else {
        const numericValue = parseFormattedNumber(value);
        setPesosIniciales(numericValue);
        setPesosInicialesDisplay(formatNumberInput(numericValue));
      }
    } else {
      setPesosInicialesError(validation.error);
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

  const handleAlternativeSelect = (value: string) => {
    setSelectedAlternative(value);

    if (value === "custom") {
      setIsCustomAlternative(true);
    } else {
      setIsCustomAlternative(false);

      const billeteraOption = billeteras.find(
        (option) => option.prettyName === value,
      );

      if (billeteraOption) {
        const tnaValue = billeteraOption.tna.toString();
        setCauchoDisplay(tnaValue);
        setCaucho(billeteraOption.tna);
        setCauchoError(undefined);
      } else {
        const fondoOption = fondos.find(
          (fondo) => fondo.nombre.replace(" - Clase A", "") === value,
        );

        if (fondoOption) {
          const tnaValue = fondoOption.tna.toString();
          setCauchoDisplay(tnaValue);
          setCaucho(fondoOption.tna);
          setCauchoError(undefined);
        }
      }
    }
  };

  const calculations = useMemo(() => {
    if (
      !selectedTicker ||
      !selectedAlternative ||
      pesosInicialesError ||
      cauchoError ||
      pesosIniciales === 0
    )
      return null;

    const selectedData = tableData.find((row) => row.ticker === selectedTicker);
    const configData = FIJA_TABLE_CONFIG.find(
      (config) => config.ticker === selectedTicker,
    );

    if (!selectedData || !configData) return null;

    const precio = selectedData.px;
    const nominales = (pesosIniciales * 100) / precio;
    const alVencimiento = (configData.pagoFinal * nominales) / 100;

    let montoCaucho: number;
    let efectiveAmount = pesosIniciales;
    let limitExceeded = false;
    let limitAmount: number | null = null;

    if (selectedAlternative !== "custom" && !isCustomAlternative) {
      const billeteraOption = billeteras.find(
        (option) => option.prettyName === selectedAlternative,
      );

      if (billeteraOption && billeteraOption.limit) {
        limitAmount = billeteraOption.limit;
        if (pesosIniciales > billeteraOption.limit) {
          efectiveAmount = billeteraOption.limit;
          limitExceeded = true;
        }
      }
    }

    if (limitExceeded && limitAmount) {
      const limitedReturns =
        limitAmount * Math.pow(1 + caucho / 100 / 365, selectedData.dias);
      const excessAmount = pesosIniciales - limitAmount;
      montoCaucho = limitedReturns + excessAmount;
    } else {
      montoCaucho =
        pesosIniciales * Math.pow(1 + caucho / 100 / 365, selectedData.dias);
    }

    const diferenciaGanancia = alVencimiento - montoCaucho;
    const porDia = diferenciaGanancia / selectedData.dias;
    const tasaGanancia = diferenciaGanancia / pesosIniciales;
    const tea = selectedData.tea;
    const teaCaucho =
      Math.pow(montoCaucho / pesosIniciales, 365 / selectedData.dias) - 1;

    return {
      precio,
      nominales,
      pesosIniciales,
      alVencimiento,
      montoCaucho,
      diferenciaGanancia,
      porDia,
      tasaGanancia,
      tea,
      teaCaucho,
      dias: selectedData.dias,
      limitExceeded,
      limitAmount,
      efectiveAmount,
    };
  }, [
    selectedTicker,
    selectedAlternative,
    pesosIniciales,
    caucho,
    tableData,
    pesosInicialesError,
    cauchoError,
    billeteras,
    isCustomAlternative,
  ]);

  const tickerOptions = tableData
    .filter((row) => row.px > 0 && row.ticker !== "TO26")
    .map((row) => ({
      value: row.ticker,
      label: `${row.ticker} - ${row.fechaVencimiento} (${row.dias}d)`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));

  const alternativeOptions = [
    {
      value: "custom",
      label: "Personalizado",
      tna: null,
      logoUrl: null,
      limit: null,
    },
    ...billeteras.map((option) => ({
      value: option.prettyName,
      label: option.prettyName,
      tna: option.tna,
      logoUrl: option.logoUrl,
      limit: option.limit,
    })),
    ...fondos.map((fondo) => ({
      value: fondo.nombre.replace(" - Clase A", ""),
      label: fondo.nombre.replace(" - Clase A", ""),
      tna: parseFloat(fondo.tna.toFixed(2)),
      logoUrl: "https://compara.b-cdn.net/bancos-png/cocos.png",
      limit: null,
    })),
  ].sort((a, b) => {
    if (a.value === "custom") return -1;
    if (b.value === "custom") return 1;
    return (b.tna || 0) - (a.tna || 0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Renta Fija</CardTitle>
        <CardDescription>
          Compará rendimientos de instrumentos de renta fija con otras
          alternativas de tasa. Podés seleccionar un instrumento de los listados
          en{" "}
          <InlineLink href="https://comparatasas.ar">
            Comparatasas.ar
          </InlineLink>
          , como Mercado Pago, Ualá, Cocos, Plazos Fijos, etc., o usar una tasa
          personalizada.
          <p className="text-sm text-muted-foreground font-bold">
            Ojo: hay instrumentos que tienen más riesgo que otros. Sólo los que
            tienen límite (ej. Ualá) tienen retornos 100% garantizados.
          </p>
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
            <Label htmlFor="pesosIniciales">Pesos Iniciales</Label>
            <Input
              id="pesosIniciales"
              type="text"
              value={pesosInicialesDisplay}
              onChange={(e) => handlePesosInicialesChange(e.target.value)}
              className={cn(
                "dark:bg-neutral-900",
                pesosInicialesError && "border-red-500",
              )}
              placeholder="Ej: 100.000"
            />
            {pesosInicialesError && (
              <p className="text-sm text-red-500">{pesosInicialesError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Alternativa (TNA %)</Label>
            <div className="flex gap-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="flex-1 justify-between dark:bg-neutral-900 sm:hidden"
                  >
                    <div className="flex items-center gap-2">
                      {!isCustomAlternative &&
                        selectedAlternative &&
                        selectedAlternative !== "custom" && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const option = alternativeOptions.find(
                                (opt) => opt.value === selectedAlternative,
                              );
                              return option?.logoUrl ? (
                                <Image
                                  src={option.logoUrl}
                                  alt={option.label}
                                  width={16}
                                  height={16}
                                  className="rounded-sm"
                                />
                              ) : null;
                            })()}
                            <span className="truncate">
                              {selectedAlternative} (
                              {formatNumber(caucho / 100, 2, "percentage")})
                            </span>
                          </div>
                        )}
                      {isCustomAlternative && (
                        <span>
                          Personalizado (
                          {formatNumber(caucho / 100, 2, "percentage")})
                        </span>
                      )}
                      {!selectedAlternative && (
                        <span>Seleccioná la alternativa...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[80vh] pb-16">
                  <DrawerHeader>
                    <DrawerTitle>Seleccionar Alternativa</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-4 overflow-y-auto">
                    <div className="space-y-2">
                      {alternativeOptions.map((option) => (
                        <DrawerClose asChild key={option.value}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 text-left"
                            onClick={() =>
                              handleAlternativeSelect(option.value)
                            }
                          >
                            <div className="flex items-center gap-2 justify-between w-full">
                              <div className="flex items-center gap-2 min-w-0">
                                {option.logoUrl && (
                                  <Image
                                    src={option.logoUrl}
                                    alt={option.label}
                                    width={20}
                                    height={20}
                                    className="rounded-sm flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {option.label}{" "}
                                    <span className="text-xs ml-4 text-muted-foreground">
                                      TNA{" "}
                                      {option.tna
                                        ? formatNumber(
                                            option.tna / 100,
                                            2,
                                            "percentage",
                                          )
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {option.limit && (
                                      <div className="text-xs text-orange-600">
                                        Límite: ${formatNumber(option.limit)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAlternative === option.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </div>
                          </Button>
                        </DrawerClose>
                      ))}
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              <Popover open={alternativeOpen} onOpenChange={setAlternativeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={alternativeOpen}
                    className="flex-1 justify-between dark:bg-neutral-900 hidden sm:flex"
                  >
                    <div className="flex items-center gap-2">
                      {!isCustomAlternative &&
                        selectedAlternative &&
                        selectedAlternative !== "custom" && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const option = alternativeOptions.find(
                                (opt) => opt.value === selectedAlternative,
                              );
                              return option?.logoUrl ? (
                                <Image
                                  src={option.logoUrl}
                                  alt={option.label}
                                  width={16}
                                  height={16}
                                  className="rounded-sm"
                                />
                              ) : null;
                            })()}
                            <span className="truncate">
                              {selectedAlternative} (
                              {formatNumber(caucho / 100, 2, "percentage")})
                            </span>
                          </div>
                        )}
                      {isCustomAlternative && (
                        <span>
                          Personalizado (
                          {formatNumber(caucho / 100, 2, "percentage")})
                        </span>
                      )}
                      {!selectedAlternative && (
                        <span>Seleccioná la alternativa...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar alternativa..." />
                    <CommandList>
                      <CommandEmpty>
                        No se encontró la alternativa.
                      </CommandEmpty>
                      <CommandGroup>
                        {alternativeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => {
                              handleAlternativeSelect(option.value);
                              setAlternativeOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2 justify-between w-full">
                              <div className="flex items-center gap-2 min-w-0">
                                {option.logoUrl && (
                                  <Image
                                    src={option.logoUrl}
                                    alt={option.label}
                                    width={16}
                                    height={16}
                                    className="rounded-sm flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {option.label}{" "}
                                    <span className="text-xs ml-2 text-muted-foreground">
                                      {option.tna
                                        ? formatNumber(
                                            option.tna / 100,
                                            2,
                                            "percentage",
                                          )
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {option.limit && (
                                      <div className="text-xs text-orange-600">
                                        Límite: ${formatNumber(option.limit)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAlternative === option.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {isCustomAlternative && (
                <Input
                  id="caucho"
                  type="text"
                  value={cauchoDisplay}
                  onChange={(e) => handleCauchoChange(e.target.value)}
                  className={cn(
                    "dark:bg-neutral-900 flex-1",
                    cauchoError && "border-red-500",
                  )}
                  placeholder="Ej: 23"
                />
              )}
            </div>
            {cauchoError && (
              <p className="text-sm text-red-500">{cauchoError}</p>
            )}
          </div>
        </div>

        {calculations && (
          <div className="space-y-6 border-t pt-6">
            {calculations &&
              calculations.limitExceeded &&
              calculations.limitAmount && (
                <Alert className="bg-orange-50 dark:bg-yellow-950 border border-orange-200 dark:border-yellow-800 rounded-lg p-3">
                  <AlertTitle>Ojo!</AlertTitle>
                  <AlertDescription>
                    {selectedAlternative} tiene un límite de $
                    {formatNumber(calculations.limitAmount)}. Solo se aplicará
                    la tasa del {formatNumber(caucho / 100, 2, "percentage")} a
                    los primeros ${formatNumber(calculations.limitAmount)}, el
                    resto ($
                    {formatNumber(pesosIniciales - calculations.limitAmount)})
                    no generará intereses.
                  </AlertDescription>
                </Alert>
              )}
            <div>
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
                    Nominales {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    {formatNumber(calculations.nominales, 0)}
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
                    Monto {selectedAlternative}
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
                        : "text-blue-600"
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
                        : "text-blue-600"
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
                        : "text-blue-600"
                    }`}
                  >
                    {formatNumber(calculations.tasaGanancia, 2, "percentage")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    TEA {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    {formatNumber(calculations.tea, 2, "percentage")}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    TEA {selectedAlternative}
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
                    {selectedTicker} rinde $
                    {formatNumber(Math.abs(calculations.diferenciaGanancia))}{" "}
                    más que {selectedAlternative}
                  </span>
                ) : (
                  <span className="text-blue-600 font-medium">
                    {selectedAlternative} rinde $
                    {formatNumber(Math.abs(calculations.diferenciaGanancia))}{" "}
                    más que {selectedTicker}
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
