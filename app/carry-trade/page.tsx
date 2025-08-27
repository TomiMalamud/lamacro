import { CarryExitTable } from "@/components/carry-trade/carry-exit-table";
import { CarryTable } from "@/components/carry-trade/carry-table";
import { MepBreakeven } from "@/components/carry-trade/mep-breakeven";
import InlineLink from "@/components/inline-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CPI_EST,
  EST_DATE_STR,
  getCarryExitSimulation,
  getCarryTradeData,
} from "@/lib/carry-trade";
import { revalidateMarketPages } from "@/lib/actions";
import { formatNumber } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import RevalidateButtonClient from "@/components/revalidate-button";

export const metadata = {
  title: "Carry Trade",
  description:
    "Calculadora de carry trade argentina. Alternativas con dólar MEP actual, límites de la banda de flotación, y salida anticipada por compresión de tasa.",
};

export const revalidate = 3600; // 1 hour

export default async function CarryTradePage() {
  const [carryTradeResult, carryExitSimulation] = await Promise.all([
    getCarryTradeData(),
    getCarryExitSimulation(),
  ]);

  if (!carryTradeResult?.carryData?.length) {
    return (
      <main className="container mx-auto px-6 md:px-16 py-8">
        <h1 className="text-3xl font-bold mb-2">Carry Trade</h1>
        <p>No se pudieron cargar los datos de carry trade.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 md:px-16 py-8">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h1 className="text-3xl font-bold">Carry Trade</h1>
        <RevalidateButtonClient action={revalidateMarketPages} />
      </div>
      <p className="text-muted-foreground mb-8">
        Fijate cuál es el mejor bono para hacer carry trade. Se actualiza casi a
        tiempo real. Cálculos por{" "}
        <InlineLink href="https://x.com/JohnGalt_is_www/status/1912555971400069372">
          JohnGalt_is_www
        </InlineLink>
        .
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Carry Trade (ARS a MEP)</CardTitle>
            <CardDescription>
              Rendimiento estimado de mantener bonos en ARS hasta el vencimiento
              y convertir a Dólar MEP.{" "}
              <span className="font-bold">
                MEP Actual: ${carryTradeResult.mep?.toFixed(2)}
              </span>
              <p>
                Hacé click en el encabezado de la tabla para ver qué significa
                cada columna
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CarryTable
              data={carryTradeResult.carryData}
              mep={carryTradeResult.mep}
            />
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Dólar Breakeven</CardTitle>
            <CardDescription>
              Los instrumentos que están por encima de la banda de flotación son
              los que tienen mayor rendimiento.
              <p className={`text-primary font-bold`}>
                MEP Actual utilizado para los cálculos: $
                {carryTradeResult.actualMep?.toFixed(2)}
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MepBreakeven data={carryTradeResult.carryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Simulación de Salida Anticipada (Compresión de Tasa)
            </CardTitle>
            <CardDescription>
              Estimación de rendimiento en ARS saliendo antes del vencimiento el{" "}
              {format(parseISO(EST_DATE_STR), "dd/MM/yy")} (
              {carryExitSimulation[0]?.days_in} días de tenencia), asumiendo una
              convergencia de la TEM a un valor estimado de{" "}
              {formatNumber(CPI_EST, 2, "percentage")}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CarryExitTable data={carryExitSimulation} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
