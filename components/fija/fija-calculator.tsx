"use client";

import { NumericInput } from "@/components/numeric-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComboboxDrawer } from "@/components/ui/combobox-drawer";
import { Label } from "@/components/ui/label";
import { TICKER_PROSPECT } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";
import {
  AlternativeOption,
  ComparatasasOption,
  FijaTableRow,
  FundData,
} from "@/types/fija";
import { Check, ChevronsUpDown, Scale, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import InlineLink from "../inline-link";
import { Button } from "../ui/button";
import FijaResults from "./fija-results";
import { NumberFormatValues } from "react-number-format";

export default function FijaCalculator({
  tableData,
  billeteras,
  fondos,
}: {
  tableData: FijaTableRow[];
  billeteras: ComparatasasOption[];
  fondos: FundData[];
}) {
  const tickerOptions = tableData
    .filter((row) => row.px > 0 && row.ticker !== "TO26")
    .map((row) => ({
      value: row.ticker,
      label: `${row.ticker} - ${row.fechaVencimiento} (${row.dias}d)`,
      dias: row.dias,
    }))
    .sort((a, b) => a.dias - b.dias)
    .map(({ dias, ...rest }) => rest);

  const [pesosIniciales, setPesosIniciales] = useState<number | string>(100000);
  const [pesosInicialesError, setPesosInicialesError] = useState<
    string | undefined
  >();
  const [selectedTicker, setSelectedTicker] = useState(
    tickerOptions.length > 0 ? tickerOptions[0].value : "",
  );
  const [caucho, setCaucho] = useState<number | string>(23);
  const [cauchoError, setCauchoError] = useState<string | undefined>();
  const [selectedAlternative, setSelectedAlternative] = useState<string>("");
  const [isCustomAlternative, setIsCustomAlternative] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<"ticker" | "comparison">(
    "ticker",
  );
  const [comision, setComision] = useState<number | string>(0.5);

  const getAlternativeDisplayName = (selectedAlternative: string): string => {
    return selectedAlternative === "custom"
      ? "Personalizado"
      : selectedAlternative;
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
        setCaucho(billeteraOption.tna);
        setCauchoError(undefined);
      } else {
        const fondoOption = fondos.find(
          (fondo) => fondo.nombre.replace(" - Clase A", "") === value,
        );

        if (fondoOption) {
          setCaucho(fondoOption.tna);
          setCauchoError(undefined);
        }
      }
    }
  };

  const calculations = useMemo(() => {
    if (
      !selectedTicker ||
      pesosInicialesError ||
      pesosIniciales === 0 ||
      pesosIniciales === "" ||
      (calculatorMode === "comparison" && (!selectedAlternative || cauchoError))
    )
      return null;

    const selectedData = tableData.find((row) => row.ticker === selectedTicker);
    const configData = TICKER_PROSPECT.find(
      (config) => config.ticker === selectedTicker,
    );

    if (!selectedData || !configData) return null;

    const precio = selectedData.px;
    const precioConComision =
      precio * (1 + (typeof comision === "number" ? comision : 0) / 100);

    // Calculate bonds purchased at the higher effective price (including fee)
    const pesosInicialesNum =
      typeof pesosIniciales === "number" ? pesosIniciales : 0;
    const nominales = (pesosInicialesNum * 100) / precioConComision;
    const alVencimientoGross = (configData.pagoFinal * nominales) / 100;
    const alVencimiento = alVencimientoGross;
    const feeAmount = ((precioConComision - precio) * nominales) / 100;

    if (calculatorMode === "ticker") {
      const tea =
        Math.pow(alVencimiento / pesosInicialesNum, 365 / selectedData.dias) -
        1;

      return {
        precio,
        precioConComision,
        nominales,
        pesosIniciales: pesosInicialesNum,
        alVencimiento,
        alVencimientoGross,
        feeAmount,
        comision: typeof comision === "number" ? comision : 0,
        tea,
        dias: selectedData.dias,
        mode: "ticker" as const,
      };
    }

    let montoCaucho: number;
    let efectiveAmount = pesosInicialesNum;
    let limitExceeded = false;
    let limitAmount: number | null = null;
    const cauchoNum = typeof caucho === "number" ? caucho : 0;

    if (selectedAlternative !== "custom" && !isCustomAlternative) {
      const billeteraOption = billeteras.find(
        (option) => option.prettyName === selectedAlternative,
      );

      if (billeteraOption && billeteraOption.limit) {
        limitAmount = billeteraOption.limit;
        if (pesosInicialesNum > billeteraOption.limit) {
          efectiveAmount = billeteraOption.limit;
          limitExceeded = true;
        }
      }
    }

    if (limitExceeded && limitAmount) {
      const limitedReturns =
        limitAmount * Math.pow(1 + cauchoNum / 100 / 365, selectedData.dias);
      const excessAmount = pesosInicialesNum - limitAmount;
      montoCaucho = limitedReturns + excessAmount;
    } else {
      montoCaucho =
        pesosInicialesNum *
        Math.pow(1 + cauchoNum / 100 / 365, selectedData.dias);
    }

    const diferenciaGanancia = alVencimiento - montoCaucho;
    const porDia = diferenciaGanancia / selectedData.dias;
    const tasaGanancia = diferenciaGanancia / pesosInicialesNum;
    const tea =
      Math.pow(alVencimiento / pesosInicialesNum, 365 / selectedData.dias) - 1;
    const teaCaucho =
      Math.pow(montoCaucho / pesosInicialesNum, 365 / selectedData.dias) - 1;

    return {
      precio,
      precioConComision,
      nominales,
      pesosIniciales: pesosInicialesNum,
      alVencimiento,
      alVencimientoGross,
      feeAmount,
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
      mode: "comparison" as const,
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
    calculatorMode,
    comision,
  ]);

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
      logoUrl: "https://images.compara.ar/cocos.png",
      limit: null,
    })),
  ].sort((a, b) => {
    if (a.value === "custom") return -1;
    if (b.value === "custom") return 1;
    return (b.tna || 0) - (a.tna || 0);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Renta Fija</CardTitle>
          <CardDescription>
            Compará rendimientos de instrumentos de renta fija con otras
            alternativas de tasa. Podés seleccionar un instrumento de los
            listados en{" "}
            <InlineLink href="https://comparatasas.ar">
              Comparatasas.ar
            </InlineLink>
            , como Mercado Pago, Ualá, Cocos, Plazos Fijos, etc., o usar una
            tasa personalizada.
            <p className="text-sm text-muted-foreground font-bold">
              Ojo: hay instrumentos que tienen más riesgo que otros. Sólo los
              que tienen límite (ej. Ualá) tienen retornos 100% garantizados.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Letra o Bono</Label>
              <ComboboxDrawer
                value={selectedTicker}
                onValueChange={setSelectedTicker}
                options={tickerOptions}
                placeholder="Seleccionar ticker..."
                searchPlaceholder="Buscar ticker..."
                emptyMessage="No se encontró el ticker."
                title="Seleccionar Ticker"
                className="dark:bg-neutral-900 mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pesosIniciales">Pesos a Invertir</Label>
                <NumericInput
                  id="pesosIniciales"
                  value={pesosIniciales}
                  onValueChange={(values) => {
                    const newValue = values.floatValue;
                    if (newValue === undefined) {
                      setPesosIniciales("");
                    } else {
                      setPesosIniciales(newValue);
                    }
                    setPesosInicialesError(undefined);
                  }}
                  className={cn(
                    "dark:bg-neutral-900 mt-1",
                    pesosInicialesError && "border-red-500",
                  )}
                  placeholder="Ej: 100.000"
                  allowNegative={false}
                  decimalScale={0}
                />
                {pesosInicialesError && (
                  <p className="text-sm text-red-500">{pesosInicialesError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comision">Comisión del Broker (%)</Label>
                <NumericInput
                  id="comision"
                  value={comision}
                  onValueChange={(values) => {
                    const newValue = values.floatValue;
                    if (newValue === undefined) {
                      setComision("");
                    } else {
                      setComision(Math.min(Math.max(newValue, 0), 2));
                    }
                  }}
                  className="dark:bg-neutral-900 mt-1"
                  placeholder="Ej: 0,5%"
                  allowNegative={false}
                  decimalScale={2}
                  suffix="%"
                  isAllowed={(values: NumberFormatValues): boolean => {
                    const numericValue = parseFloat(values.value);
                    return !isNaN(numericValue) && numericValue <= 2;
                  }}
                />
              </div>
            </div>
            {calculatorMode === "comparison" && (
              <div className="space-y-2">
                <Label>Alternativa (TNA %)</Label>
                <div className="flex gap-2">
                  <ComboboxDrawer<string, AlternativeOption>
                    value={selectedAlternative}
                    onValueChange={handleAlternativeSelect}
                    options={alternativeOptions}
                    placeholder="Seleccioná la alternativa..."
                    searchPlaceholder="Buscar alternativa..."
                    emptyMessage="No se encontró la alternativa."
                    title="Seleccionar Alternativa"
                    className="flex-1 dark:bg-neutral-900 mt-1"
                    renderTrigger={(selectedOption) => (
                      <>
                        <div className="flex items-center gap-2">
                          {!isCustomAlternative &&
                            selectedAlternative &&
                            selectedAlternative !== "custom" && (
                              <div className="flex items-center gap-2">
                                {selectedOption?.logoUrl && (
                                  <Image
                                    src={selectedOption.logoUrl}
                                    alt={selectedOption.label}
                                    width={16}
                                    height={16}
                                    className="rounded-sm"
                                    unoptimized
                                  />
                                )}
                                <span className="truncate">
                                  {getAlternativeDisplayName(
                                    selectedAlternative,
                                  )}{" "}
                                  (
                                  {formatNumber(
                                    (typeof caucho === "number" ? caucho : 0) /
                                      100,
                                    2,
                                    "percentage",
                                  )}
                                  )
                                </span>
                              </div>
                            )}
                          {isCustomAlternative && <span>Personalizado</span>}
                          {!selectedAlternative && (
                            <span>Seleccioná la alternativa...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </>
                    )}
                    renderOption={(option, isSelected) => (
                      <div className="flex items-center gap-2 justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          {option.logoUrl && (
                            <Image
                              src={option.logoUrl}
                              alt={option.label}
                              width={20}
                              height={20}
                              className="rounded-sm flex-shrink-0"
                              unoptimized
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {option.label}{" "}
                              <span className="text-xs ml-2 text-muted-foreground">
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
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                    )}
                  />

                  {isCustomAlternative && (
                    <NumericInput
                      id="caucho"
                      value={caucho}
                      onValueChange={(values) => {
                        const newValue = values.floatValue;
                        if (newValue === undefined) {
                          setCaucho("");
                        } else {
                          setCaucho(newValue);
                        }
                        setCauchoError(undefined);
                      }}
                      className={cn(
                        "dark:bg-neutral-900 flex-1",
                        cauchoError && "border-red-500",
                      )}
                      placeholder="23"
                      allowNegative={false}
                      decimalScale={3}
                      suffix="%"
                    />
                  )}
                </div>
                {cauchoError && (
                  <p className="text-sm text-red-500">{cauchoError}</p>
                )}
              </div>
            )}

            <div className="pt-4 flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  setCalculatorMode(
                    calculatorMode === "ticker" ? "comparison" : "ticker",
                  )
                }
              >
                {calculatorMode === "ticker" ? (
                  <>
                    <Scale />
                    Comparar con otra alternativa
                  </>
                ) : (
                  <>
                    <X />
                    Dejar de comparar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <FijaResults
        calculations={calculations}
        selectedTicker={selectedTicker}
        selectedAlternative={selectedAlternative}
        tableData={tableData}
        caucho={typeof caucho === "number" ? caucho : 0}
        pesosIniciales={typeof pesosIniciales === "number" ? pesosIniciales : 0}
      />
    </div>
  );
}
