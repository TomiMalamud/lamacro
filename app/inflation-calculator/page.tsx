"use client";

import { InflationForm } from "@/components/inflation/form";
import { ShareCalculationDialog } from "@/components/share-calculation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InflationCalculatorContent() {
  const searchParams = useSearchParams();

  // Parse URL parameters with fallbacks
  const startMonth = searchParams.get("startMonth") ? parseInt(searchParams.get("startMonth")!) : undefined;
  const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!) : undefined;
  const startValue = searchParams.get("startValue") ? parseFloat(searchParams.get("startValue")!) : undefined;
  const endMonth = searchParams.get("endMonth") ? parseInt(searchParams.get("endMonth")!) : undefined;
  const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!) : undefined;

  return (
    <div className="container mx-auto text-center py-8 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-6">Calculadora de Inflación</h1>

      <Card>
        <CardContent className="p-4 text-center">
          <InflationForm
            defaultStartMonth={startMonth}
            defaultStartYear={startYear}
            defaultStartValue={startValue}
            defaultEndMonth={endMonth}
            defaultEndYear={endYear}
          />
        </CardContent>
        <CardFooter className="flex justify-center pb-4">
          <ShareCalculationDialog />
        </CardFooter>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Fuente</CardTitle>
          <CardDescription>
            Este cálculo se basa en datos históricos de la inflación y la actualización de precios con la inflación del BCRA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
          </p>
          <Button variant="link" asChild className="text-blue-500 hover:text-blue-600">
            <Link href="https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp" target="_blank" rel="noopener noreferrer">
              Fuente de datos oficial del BCRA
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InflationCalculatorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InflationCalculatorContent />
    </Suspense>
  );
}
