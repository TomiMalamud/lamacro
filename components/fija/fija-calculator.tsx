"use client";

import { NumericInput } from "@/components/numeric-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComboboxDrawer } from "@/components/ui/combobox-drawer";
import { Label } from "@/components/ui/label";
import { FIJA_TABLE_CONFIG } from "@/lib/fija";
import { cn, formatNumber } from "@/lib/utils";
import {
  AlternativeOption,
  ComparatasasOption,
  FijaTableRow,
  FundData,
} from "@/types/fija";
import NumberFlow from "@number-flow/react";
import { Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import InlineLink from "../inline-link";

function getAlternativeDisplayName(selectedAlternative: string): string {
  return selectedAlternative === "custom"
    ? "Personalizado"
    : selectedAlternative;
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
  const [pesosInicialesError, setPesosInicialesError] = useState<
    string | undefined
  >();
  const [selectedTicker, setSelectedTicker] = useState("");
  const [caucho, setCaucho] = useState(23);
  const [cauchoError, setCauchoError] = useState<string | undefined>();
  const [selectedAlternative, setSelectedAlternative] = useState<string>("");
  const [isCustomAlternative, setIsCustomAlternative] = useState(false);

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
      logoUrl: "https://images.compara.ar/cocos.png",
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
            <ComboboxDrawer
              value={selectedTicker}
              onValueChange={setSelectedTicker}
              options={tickerOptions}
              placeholder="Seleccionar ticker..."
              searchPlaceholder="Buscar ticker..."
              emptyMessage="No se encontró el ticker."
              title="Seleccionar Ticker"
              className="dark:bg-neutral-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pesosIniciales">Pesos Iniciales</Label>
            <NumericInput
              id="pesosIniciales"
              value={pesosIniciales}
              onValueChange={(values) => {
                const newValue = values.floatValue || 0;
                setPesosIniciales(newValue);
                setPesosInicialesError(undefined);
              }}
              className={cn(
                "dark:bg-neutral-900",
                pesosInicialesError && "border-red-500",
              )}
              placeholder="100.000"
              allowNegative={false}
              decimalScale={0}
            />
            {pesosInicialesError && (
              <p className="text-sm text-red-500">{pesosInicialesError}</p>
            )}
          </div>

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
                className="flex-1 dark:bg-neutral-900"
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
                              {getAlternativeDisplayName(selectedAlternative)} (
                              {formatNumber(caucho / 100, 2, "percentage")})
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
                              ? formatNumber(option.tna / 100, 2, "percentage")
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
                    const newValue = values.floatValue || 0;
                    setCaucho(newValue);
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
        </div>

        {calculations && (
          <div className="space-y-6 border-t pt-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Precio {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.precio}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Nominales {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.nominales}
                      locales="es-AR"
                      format={{ maximumFractionDigits: 0 }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    {selectedTicker} Al Vencimiento
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.alVencimiento}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Monto {getAlternativeDisplayName(selectedAlternative)}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.montoCaucho}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
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
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.diferenciaGanancia}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Por Día
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.porDia}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Tasa Ganancia
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.tasaGanancia}
                      locales="es-AR"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                        signDisplay: "always",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    TEA {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.tea}
                      locales="es-AR"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">
                    TEA {getAlternativeDisplayName(selectedAlternative)}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.teaCaucho}
                      locales="es-AR"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-base">
                {calculations.diferenciaGanancia >= 0 ? (
                  <span className="font-bold">
                    {selectedTicker} rinde{" "}
                    <NumberFlow
                      value={Math.abs(calculations.diferenciaGanancia)}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />{" "}
                    más que {getAlternativeDisplayName(selectedAlternative)}
                  </span>
                ) : (
                  <span className="font-medium">
                    {getAlternativeDisplayName(selectedAlternative)} rinde{" "}
                    <NumberFlow
                      value={Math.abs(calculations.diferenciaGanancia)}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />{" "}
                    más que {selectedTicker}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  en <NumberFlow
                    value={calculations.dias}
                    locales="es-AR"
                  />{" "}
                  días
                </span>
              </div>
            </div>
            {calculations &&
              calculations.limitExceeded &&
              calculations.limitAmount && (
                <Alert className="bg-orange-50 dark:bg-yellow-950 border border-orange-200 dark:border-yellow-800 rounded-lg p-3">
                  <AlertTitle>Ojo!</AlertTitle>
                  <AlertDescription>
                    {getAlternativeDisplayName(selectedAlternative)} tiene un
                    límite de ${formatNumber(calculations.limitAmount)}. Solo se
                    aplicará la tasa del{" "}
                    {formatNumber(caucho / 100, 2, "percentage")} a los primeros
                    ${formatNumber(calculations.limitAmount)}, el resto ($
                    {formatNumber(pesosIniciales - calculations.limitAmount)})
                    no generará intereses.
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
