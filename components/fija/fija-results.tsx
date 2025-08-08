"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TICKER_PROSPECT } from "@/lib/constants";
import { calculateTEA, calculateTEM, calculateTNA } from "@/lib/fija";
import { formatNumber } from "@/lib/utils";
import { FijaTableRow } from "@/types/fija";
import NumberFlow from "@number-flow/react";

interface FijaCalculations {
  precio: number;
  precioConComision: number;
  nominales: number;
  nominalesBruto: number;
  pesosIniciales: number;
  alVencimiento: number;
  alVencimientoGross: number;
  feeAmount: number;
  gananciaBruta?: number;
  gananciaNeta?: number;
  comision?: number;
  tea: number;
  dias: number;
  mode: "ticker" | "comparison";
  montoCaucho?: number;
  diferenciaGanancia?: number;
  porDia?: number;
  tasaGanancia?: number;
  teaCaucho?: number;
  limitExceeded?: boolean;
  limitAmount?: number | null;
  efectiveAmount?: number;
}

function getAlternativeDisplayName(selectedAlternative: string): string {
  return selectedAlternative === "custom"
    ? "Personalizado"
    : selectedAlternative;
}

export default function FijaResults({
  calculations,
  selectedTicker,
  selectedAlternative,
  tableData,
  caucho,
  pesosIniciales,
}: {
  calculations: FijaCalculations | null;
  selectedTicker: string;
  selectedAlternative: string;
  tableData: FijaTableRow[];
  caucho: number;
  pesosIniciales: number;
}) {
  if (!calculations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Completá los datos para ver los resultados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {calculations.mode === "ticker" && (
            <>
              {/* Basic data for ticker mode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Precio {selectedTicker}
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.precioConComision}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Sin comisión: $
                    <NumberFlow
                      value={calculations.precio}
                      locales="es-AR"
                      format={{
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    Nominales
                  </Label>
                  <div className="text-lg font-medium">
                    <NumberFlow
                      value={calculations.nominales}
                      locales="es-AR"
                      format={{ maximumFractionDigits: 0 }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Sin comisión:{" "}
                    <NumberFlow
                      value={calculations.nominalesBruto}
                      locales="es-AR"
                      format={{
                        maximumFractionDigits: 0,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">TNA</Label>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            const selectedData = tableData.find(
                              (row) => row.ticker === selectedTicker,
                            );
                            if (!selectedData) return 0;
                            const configData = TICKER_PROSPECT.find(
                              (config) => config.ticker === selectedTicker,
                            );
                            if (!configData) return 0;
                            return calculateTNA(
                              configData.pagoFinal,
                              selectedData.px,
                              selectedData.dias,
                            );
                          })()}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                      <span className="text-primary">
                        <NumberFlow
                          value={(() => {
                            const selectedData = tableData.find(
                              (row) => row.ticker === selectedTicker,
                            );
                            if (!selectedData) return 0;
                            return calculateTNA(
                              calculations.alVencimiento,
                              calculations.pesosIniciales,
                              selectedData.dias,
                            );
                          })()}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">TEM</Label>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            const selectedData = tableData.find(
                              (row) => row.ticker === selectedTicker,
                            );
                            if (!selectedData) return 0;
                            const configData = TICKER_PROSPECT.find(
                              (config) => config.ticker === selectedTicker,
                            );
                            if (!configData) return 0;
                            return calculateTEM(
                              configData.pagoFinal,
                              selectedData.px,
                              selectedData.meses,
                            );
                          })()}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                      <span className="text-primary">
                        <NumberFlow
                          value={(() => {
                            const selectedData = tableData.find(
                              (row) => row.ticker === selectedTicker,
                            );
                            if (!selectedData) return 0;
                            const configData = TICKER_PROSPECT.find(
                              (config) => config.ticker === selectedTicker,
                            );
                            if (!configData) return 0;
                            return calculateTEM(
                              configData.pagoFinal,
                              calculations.precioConComision,
                              selectedData.meses,
                            );
                          })()}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">TEA</Label>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            const selectedData = tableData.find(
                              (row) => row.ticker === selectedTicker,
                            );
                            if (!selectedData) return 0;
                            const configData = TICKER_PROSPECT.find(
                              (config) => config.ticker === selectedTicker,
                            );
                            if (!configData) return 0;
                            return calculateTEA(
                              configData.pagoFinal,
                              selectedData.px,
                              selectedData.dias,
                            );
                          })()}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                      <span className="text-primary">
                        <NumberFlow
                          value={calculations.tea}
                          locales="es-AR"
                          format={{
                            style: "percent",
                            maximumFractionDigits: 2,
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results for ticker mode */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Pesos a invertir</span>
                  <NumberFlow
                    value={
                      (calculations.nominales *
                        calculations.precioConComision) /
                      100
                    }
                    locales="es-AR"
                    format={{
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">
                    Ganancia Bruta al Vencimiento (
                    {
                      tableData.find((row) => row.ticker === selectedTicker)
                        ?.fechaVencimiento
                    }
                    )
                  </span>
                  <NumberFlow
                    value={calculations.gananciaBruta || 0}
                    locales="es-AR"
                    format={{
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Comisión</span>
                  <NumberFlow
                    value={-calculations.feeAmount}
                    locales="es-AR"
                    format={{
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center py-2 text-lg font-bold">
                  Ganancia Neta
                  <NumberFlow
                    value={calculations.gananciaNeta || 0}
                    locales="es-AR"
                    format={{
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {calculations.mode === "comparison" && (
            <>
              {/* TEM-TNA-TEA combined display with before (strikethrough) and after (highlighted) for comparison mode */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Rendimientos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center font-semibold text-sm mb-2">
                    {selectedTicker}
                  </div>
                  <div className="text-center font-semibold text-sm mb-2">
                    {getAlternativeDisplayName(selectedAlternative)}
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                  <div className="text-xs font-medium text-muted-foreground">
                    TNA
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    TEM
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    TEA
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    TNA
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    TEM
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    TEA
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                  <div className="text-sm font-medium flex items-center justify-center gap-2">
                    <span className="line-through text-muted-foreground">
                      <NumberFlow
                        value={(() => {
                          const selectedData = tableData.find(
                            (row) => row.ticker === selectedTicker,
                          );
                          if (!selectedData) return 0;
                          const configData = TICKER_PROSPECT.find(
                            (config) => config.ticker === selectedTicker,
                          );
                          if (!configData) return 0;
                          return calculateTNA(
                            configData.pagoFinal,
                            selectedData.px,
                            selectedData.dias,
                          );
                        })()}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                    <span className="text-primary">
                      <NumberFlow
                        value={(() => {
                          const selectedData = tableData.find(
                            (row) => row.ticker === selectedTicker,
                          );
                          if (!selectedData) return 0;
                          const configData = TICKER_PROSPECT.find(
                            (config) => config.ticker === selectedTicker,
                          );
                          if (!configData) return 0;
                          return calculateTNA(
                            configData.pagoFinal,
                            calculations.precioConComision,
                            selectedData.dias,
                          );
                        })()}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                  </div>
                  <div className="text-sm font-medium flex items-center justify-center gap-2">
                    <span className="line-through text-muted-foreground">
                      <NumberFlow
                        value={(() => {
                          const selectedData = tableData.find(
                            (row) => row.ticker === selectedTicker,
                          );
                          if (!selectedData) return 0;
                          const configData = TICKER_PROSPECT.find(
                            (config) => config.ticker === selectedTicker,
                          );
                          if (!configData) return 0;
                          return calculateTEM(
                            configData.pagoFinal,
                            selectedData.px,
                            selectedData.meses,
                          );
                        })()}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                    <span className="text-primary">
                      <NumberFlow
                        value={(() => {
                          const selectedData = tableData.find(
                            (row) => row.ticker === selectedTicker,
                          );
                          if (!selectedData) return 0;
                          const configData = TICKER_PROSPECT.find(
                            (config) => config.ticker === selectedTicker,
                          );
                          if (!configData) return 0;
                          return calculateTEM(
                            configData.pagoFinal,
                            calculations.precioConComision,
                            selectedData.meses,
                          );
                        })()}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                  </div>
                  <div className="text-sm font-medium flex items-center justify-center gap-2">
                    <span className="line-through text-muted-foreground">
                      <NumberFlow
                        value={(() => {
                          const selectedData = tableData.find(
                            (row) => row.ticker === selectedTicker,
                          );
                          if (!selectedData) return 0;
                          const configData = TICKER_PROSPECT.find(
                            (config) => config.ticker === selectedTicker,
                          );
                          if (!configData) return 0;
                          return calculateTEA(
                            configData.pagoFinal,
                            selectedData.px,
                            selectedData.dias,
                          );
                        })()}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                    <span className="text-primary">
                      <NumberFlow
                        value={calculations.tea}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                  </div>
                  <div className="text-sm font-medium flex items-center justify-center gap-2">
                    <span className="line-through text-muted-foreground">
                      <NumberFlow
                        value={caucho / 100}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                    <span className="text-primary">
                      <NumberFlow
                        value={caucho / 100}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center">
                    N/A
                  </div>
                  <div className="text-sm font-medium flex items-center justify-center gap-2">
                    <span className="line-through text-muted-foreground">
                      <NumberFlow
                        value={calculations.teaCaucho || 0}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                    <span className="text-primary">
                      <NumberFlow
                        value={calculations.teaCaucho || 0}
                        locales="es-AR"
                        format={{ style: "percent", maximumFractionDigits: 1 }}
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison mode - 2 columns */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center font-semibold text-sm">
                    {selectedTicker}
                  </div>
                  <div className="text-center font-semibold text-sm">
                    {getAlternativeDisplayName(selectedAlternative)}
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Pesos a invertir</span>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <NumberFlow
                      value={
                        (calculations.nominales *
                          calculations.precioConComision) /
                        100
                      }
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                    <NumberFlow
                      value={calculations.pesosIniciales}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Comisión</span>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <NumberFlow
                      value={calculations.feeAmount}
                      locales="es-AR"
                      format={{
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }}
                    />
                    <span>$0</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">
                    Rendimiento al vencimiento (
                    {
                      tableData.find((row) => row.ticker === selectedTicker)
                        ?.fechaVencimiento
                    }
                    )
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <NumberFlow
                      value={calculations.tea}
                      locales="es-AR"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                      }}
                    />
                    <NumberFlow
                      value={calculations.teaCaucho || 0}
                      locales="es-AR"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Comparison message */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-base">
                  {calculations.diferenciaGanancia &&
                  calculations.diferenciaGanancia >= 0 ? (
                    <span className="font-bold">
                      {selectedTicker} rinde{" "}
                      <NumberFlow
                        value={Math.abs(calculations.diferenciaGanancia ?? 0)}
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
                        value={Math.abs(calculations.diferenciaGanancia ?? 0)}
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
            </>
          )}
          {calculations &&
            calculations.limitExceeded &&
            calculations.limitAmount && (
              <Alert className="bg-orange-50 dark:bg-yellow-950 border border-orange-200 dark:border-yellow-800 rounded-lg p-3">
                <AlertTitle>Ojo!</AlertTitle>
                <AlertDescription>
                  {getAlternativeDisplayName(selectedAlternative)} tiene un
                  límite de ${formatNumber(calculations.limitAmount)}. Solo se
                  aplicará la tasa del{" "}
                  {formatNumber(caucho / 100, 2, "percentage")} a los primeros $
                  {formatNumber(calculations.limitAmount)}, el resto ($
                  {formatNumber(pesosIniciales - calculations.limitAmount)}) no
                  generará intereses.
                </AlertDescription>
              </Alert>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
