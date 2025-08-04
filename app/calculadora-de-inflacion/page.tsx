import { InflationForm } from "@/components/inflation/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCombinedInflationData } from "@/lib/inflation";
import Link from "next/link";

export const revalidate = 3600; // 1 hour

export const metadata = {
  title: "Calculadora de Inflación",
  description:
    "Calculadora de inflación y actualización de precios con la inflación del BCRA.",
};

export default async function InflationCalculatorPage() {
  const inflationData = await getCombinedInflationData();

  return (
    <div className="container mx-auto text-center py-8 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-6">Calculadora de Inflación</h1>
      <InflationForm inflationData={inflationData} />
      <Card className="mt-4 py-6">
        <CardHeader>
          <CardTitle>Fuente</CardTitle>
          <CardDescription>
            Este cálculo se basa en datos históricos de la inflación y la
            actualización de precios con la inflación del BCRA.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
