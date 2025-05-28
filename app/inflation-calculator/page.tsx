import { InflationForm } from "@/components/inflation/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

type SearchParams = Promise<{
  startMonth?: string;
  startYear?: string;
  startValue?: string;
  endMonth?: string;
  endYear?: string;
}>;

interface InflationCalculatorPageProps {
  searchParams: SearchParams;
}

export default async function InflationCalculatorPage(
  props: InflationCalculatorPageProps,
) {
  const searchParams = await props.searchParams;
  const startMonth = searchParams.startMonth
    ? parseInt(searchParams.startMonth)
    : undefined;
  const startYear = searchParams.startYear
    ? parseInt(searchParams.startYear)
    : undefined;
  const startValue = searchParams.startValue
    ? parseFloat(searchParams.startValue)
    : undefined;
  const endMonth = searchParams.endMonth
    ? parseInt(searchParams.endMonth)
    : undefined;
  const endYear = searchParams.endYear
    ? parseInt(searchParams.endYear)
    : undefined;

  return (
    <div className="container mx-auto text-center py-8 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-6">Calculadora de Inflación</h1>
      <InflationForm
        defaultStartMonth={startMonth}
        defaultStartYear={startYear}
        defaultStartValue={startValue}
        defaultEndMonth={endMonth}
        defaultEndYear={endYear}
      />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Fuente</CardTitle>
          <CardDescription>
            Este cálculo se basa en datos históricos de la inflación y la
            actualización de precios con la inflación del BCRA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p></p>
          <Button
            variant="link"
            asChild
            className="text-blue-500 hover:text-blue-600"
          >
            <Link
              href="https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables_datos.asp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Fuente de datos oficial del BCRA
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
