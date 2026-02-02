"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

  const selectedData = tableData.find((row) => row.ticker === selectedTicker);

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          {calculations.mode === "ticker" && (
            <>
              {/* Basic data for ticker mode */}
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
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
                <h3 className="text-muted-foreground text-sm">
                  Tasas antes y después de comisión
                </h3>
                <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">TNA</Label>
                    <div className="font-medium flex items-center gap-2">
                      <span className="text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            if (!selectedData) return 0;
                            return calculateTNA(
                              selectedData.pagoFinal,
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
                    <div className="font-medium flex items-center gap-2">
                      <span className="text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            if (!selectedData) return 0;
                            return calculateTEM(
                              selectedData.pagoFinal,
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
                            if (!selectedData) return 0;
                            return calculateTEM(
                              selectedData.pagoFinal,
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
                    <div className="font-medium flex items-center gap-2">
                      <span className="text-muted-foreground">
                        <NumberFlow
                          value={(() => {
                            if (!selectedData) return 0;
                            return calculateTEA(
                              selectedData.pagoFinal,
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Letra/Bono
                    </th>
                    <th className="text-right py-2 font-semibold">
                      {selectedTicker}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  <tr>
                    <td className="py-3 font-medium">Pesos a invertir</td>
                    <td className="py-3 text-right">
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
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">
                      Ganancia Bruta al Vencimiento (
                      {
                        tableData.find((row) => row.ticker === selectedTicker)
                          ?.fechaVencimiento
                      }
                      )
                    </td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={calculations.gananciaBruta || 0}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Comisión</td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={-calculations.feeAmount}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-lg">Ganancia Neta</td>
                    <td className="py-3 text-right font-bold text-lg">
                      <NumberFlow
                        value={calculations.gananciaNeta || 0}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {calculations.mode === "comparison" && (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 font-medium text-muted-foreground">
                        Tasa
                      </th>
                      <th className="text-center py-2 font-semibold">
                        {selectedTicker}
                      </th>
                      <th className="text-center py-2 font-semibold">
                        {getAlternativeDisplayName(selectedAlternative)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    <tr>
                      <td className="py-3 font-medium text-muted-foreground">
                        TNA
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-base text-muted-foreground">
                            <NumberFlow
                              value={(() => {
                                if (!selectedData) return 0;
                                return calculateTNA(
                                  selectedData.pagoFinal,
                                  selectedData.px,
                                  selectedData.dias,
                                );
                              })()}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                          <span className="text-base text-primary font-medium">
                            <NumberFlow
                              value={(() => {
                                if (!selectedData) return 0;
                                return calculateTNA(
                                  selectedData.pagoFinal,
                                  calculations.precioConComision,
                                  selectedData.dias,
                                );
                              })()}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-base text-primary font-medium">
                          <NumberFlow
                            value={caucho / 100}
                            locales="es-AR"
                            format={{
                              style: "percent",
                              maximumFractionDigits: 1,
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted-foreground">
                        TEM
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-base text-muted-foreground">
                            <NumberFlow
                              value={(() => {
                                if (!selectedData) return 0;
                                return calculateTEM(
                                  selectedData.pagoFinal,
                                  selectedData.px,
                                  selectedData.meses,
                                );
                              })()}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                          <span className="text-base text-primary font-medium">
                            <NumberFlow
                              value={(() => {
                                if (!selectedData) return 0;
                                return calculateTEM(
                                  selectedData.pagoFinal,
                                  calculations.precioConComision,
                                  selectedData.meses,
                                );
                              })()}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-base text-primary font-medium">
                          <NumberFlow
                            value={(() => {
                              const selectedData = tableData.find(
                                (row) => row.ticker === selectedTicker,
                              );
                              if (!selectedData) return 0;
                              const tnaDecimal = caucho / 100;
                              return (
                                Math.pow(
                                  1 + tnaDecimal,
                                  selectedData.meses / 12,
                                ) - 1
                              );
                            })()}
                            locales="es-AR"
                            format={{
                              style: "percent",
                              maximumFractionDigits: 1,
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-muted-foreground">
                        TEA
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-base text-muted-foreground">
                            <NumberFlow
                              value={(() => {
                                if (!selectedData) return 0;
                                return calculateTEA(
                                  selectedData.pagoFinal,
                                  selectedData.px,
                                  selectedData.dias,
                                );
                              })()}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                          <span className="text-base text-primary font-medium">
                            <NumberFlow
                              value={calculations.tea}
                              locales="es-AR"
                              format={{
                                style: "percent",
                                maximumFractionDigits: 1,
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-base text-primary font-medium">
                          <NumberFlow
                            value={calculations.teaCaucho || 0}
                            locales="es-AR"
                            format={{
                              style: "percent",
                              maximumFractionDigits: 1,
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Concepto
                    </th>
                    <th className="text-right py-2 font-semibold">
                      {selectedTicker}
                    </th>
                    <th className="text-right py-2 font-semibold">
                      {getAlternativeDisplayName(selectedAlternative)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  <tr>
                    <td className="py-3 font-medium">Pesos a invertir</td>
                    <td className="py-3 text-right">
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
                    </td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={calculations.pesosIniciales}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">
                      Ganancia Bruta al Vencimiento (
                      {
                        tableData.find((row) => row.ticker === selectedTicker)
                          ?.fechaVencimiento
                      }
                      )
                    </td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={calculations.gananciaBruta || 0}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={
                          calculations.montoCaucho
                            ? calculations.montoCaucho -
                              calculations.pesosIniciales
                            : 0
                        }
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Comisión</td>
                    <td className="py-3 text-right">
                      <NumberFlow
                        value={-calculations.feeAmount}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      $0
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-lg">Ganancia Neta</td>
                    <td className="py-3 text-right font-bold text-lg">
                      <NumberFlow
                        value={calculations.gananciaNeta || 0}
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                    <td className="py-3 text-right font-bold text-lg">
                      <NumberFlow
                        value={
                          calculations.montoCaucho
                            ? calculations.montoCaucho -
                              calculations.pesosIniciales
                            : 0
                        }
                        locales="es-AR"
                        format={{
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

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
