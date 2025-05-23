"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { getTamarCallValueAction } from "@/lib/tamar-actions";
import type { CallValueRequest, CallValueResponse } from "@/lib/duales";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface CallValueComponentProps {
  initialRequest?: CallValueRequest;
  initialResponse?: CallValueResponse | null;
}

export default function CallValueComponent({
  initialRequest = {
    target_mean: 0.0143,
    target_prob: 0.0244,
    threshold: 0.0271,
    min_val: 0.0049,
  },
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

  const handleInputChange = (field: keyof CallValueRequest, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setRequest((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Calculadora de Prima del Call
          </CardTitle>
          <CardDescription>
            Calculá la prima del call y la distribución de los valores de
            amortización para los bonos TAMAR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_mean">Target Medio</Label>
                <Input
                  className="mt-2 bg-white dark:bg-black"
                  id="target_mean"
                  type="number"
                  step="0.0001"
                  value={request.target_mean}
                  onChange={(e) =>
                    handleInputChange("target_mean", e.target.value)
                  }
                  placeholder="0.0143"
                />
              </div>

              <div>
                <Label htmlFor="target_prob">Target (Probabilidad)</Label>
                <Input
                  className="mt-2 bg-white dark:bg-black"
                  id="target_prob"
                  type="number"
                  step="0.0001"
                  value={request.target_prob}
                  onChange={(e) =>
                    handleInputChange("target_prob", e.target.value)
                  }
                  placeholder="0.0244"
                />
              </div>

              <div>
                <Label htmlFor="threshold">Umbral</Label>
                <Input
                  className="mt-2 bg-white dark:bg-black"
                  id="threshold"
                  type="number"
                  step="0.0001"
                  value={request.threshold}
                  onChange={(e) =>
                    handleInputChange("threshold", e.target.value)
                  }
                  placeholder="0.0271"
                />
              </div>

              <div>
                <Label htmlFor="min_val">Valor Mínimo</Label>
                <Input
                  className="mt-2 bg-white dark:bg-black"
                  id="min_val"
                  type="number"
                  step="0.0001"
                  value={request.min_val}
                  onChange={(e) => handleInputChange("min_val", e.target.value)}
                  placeholder="0.0049"
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
                Valor de la Prima del Call
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
