"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumericInput } from "@/components/numeric-input";
import { Label } from "@/components/ui/label";
import type { CallValueRequest, CallValueResponse } from "@/lib/duales";
import { getTamarCallValueAction } from "@/lib/tamar-actions";
import { BarChart3, Info, Loader2, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import InlineLink from "../inline-link";

export const DEFAULT_CALL_VALUE_REQUEST: CallValueRequest = {
  target_mean: 0.0154, // 0.1851/12, obtenido de mediana REM dic-26
  target_prob: 0.0294, // 1/34, participantes de REM dic-26
  threshold: 0.0315, // 0.0378/12, obtenido de máximo REM dic-26
  min_val: 0.0058, // 0.0068/12, obtenido de mínimo REM dic-26
};
interface CallValueComponentProps {
  initialRequest?: CallValueRequest;
  initialResponse?: CallValueResponse | null;
}

export default function CallValueComponent({
  initialRequest = DEFAULT_CALL_VALUE_REQUEST,
  initialResponse = null,
}: CallValueComponentProps) {
  const [request, setRequest] = useState<CallValueRequest>(initialRequest);
  const [response, setResponse] = useState<CallValueResponse | null>(
    initialResponse,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTamarCallValueAction(request);
      if ("error" in result) {
        setError(result.error);
        setResponse(null);
      } else {
        setResponse(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CallValueRequest,
    value: string | number,
  ) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setRequest((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex leading-6 items-center gap-2">
            Calculadora de Prima del Call de TTD26 · Dic-26
          </CardTitle>
          <CardDescription>
            Calculá la prima del call y la distribución de los valores de
            amortización para los bonos TAMAR. Números obtenidos de las
            estimaciones del{" "}
            <InlineLink href="https://www.bcra.gob.ar/PublicacionesEstadisticas/Relevamiento_Expectativas_de_Mercado.asp">
              REM
            </InlineLink>{" "}
            al 26 de diciembre de 2026.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_mean">Mediana estimada de TAMAR</Label>
                <NumericInput
                  className="mt-2 bg-white dark:bg-black"
                  id="target_mean"
                  decimalScale={4}
                  value={request.target_mean}
                  onValueChange={(values) =>
                    handleInputChange("target_mean", values.floatValue || 0)
                  }
                  placeholder="0,0143"
                />
              </div>

              <div>
                <Label htmlFor="target_prob">
                  Probabilidad asignada a máximo estimado
                </Label>
                <NumericInput
                  className="mt-2 bg-white dark:bg-black"
                  id="target_prob"
                  decimalScale={4}
                  value={request.target_prob}
                  onValueChange={(values) =>
                    handleInputChange("target_prob", values.floatValue || 0)
                  }
                  placeholder="0,0244"
                />
              </div>

              <div>
                <Label htmlFor="threshold">Máximo valor esperado</Label>
                <NumericInput
                  className="mt-2 bg-white dark:bg-black"
                  id="threshold"
                  decimalScale={4}
                  value={request.threshold}
                  onValueChange={(values) =>
                    handleInputChange("threshold", values.floatValue || 0)
                  }
                  placeholder="0,0271"
                />
              </div>

              <div>
                <Label htmlFor="min_val">
                  Mínimo valor esperado
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 inline-block ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Free risk de USA 400 bps + riesgo país 300 bps
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <NumericInput
                  className="mt-2 bg-white dark:bg-black"
                  id="min_val"
                  decimalScale={4}
                  value={request.min_val}
                  onValueChange={(values) =>
                    handleInputChange("min_val", values.floatValue || 0)
                  }
                  placeholder="0,0049"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Calcular Prima"
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {response && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Valor de la Prima del Call de TTD26
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {response.call_value_b100.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Si el bono equivalente tasa fija vale 100, TTD26 debería valer{" "}
                  <span className="font-bold text-primary">
                    {(response.call_value_b100 + 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución en crudo (avanzado)
              </CardTitle>
              <CardDescription>
                Distribución de probabilidad y valores de amortización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">
                        TAMAR DIC 26 (%)
                      </TableHead>
                      <TableHead className="text-left">TAMAR Mean</TableHead>
                      <TableHead className="text-left">
                        Fixed Amort (B100)
                      </TableHead>
                      <TableHead className="text-left">
                        Probability (%)
                      </TableHead>
                      <TableHead className="text-left">
                        TAMAR Amort (B100)
                      </TableHead>
                      <TableHead className="text-left">
                        TAMAR Diff (B100)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.distribution_data.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.TAMAR_DIC_26_pct.toFixed(2)}
                        </TableCell>
                        <TableCell>{item.TAMAR_MEAN.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.fixed_amort_b100.toFixed(2)}
                        </TableCell>
                        <TableCell>{item.proba_pct.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.tamar_amort_b100.toFixed(2)}
                        </TableCell>
                        <TableCell>{item.tamar_diff_b100.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
