import CarryExitInput from "@/components/carry-trade/carry-exit-input";
import { CarryExitTable } from "@/components/carry-trade/carry-exit-table";
import { CarryTable } from "@/components/carry-trade/carry-table";
import { MepBreakevenChart } from "@/components/carry-trade/mep-breakeven-chart";
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
import { formatNumber } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";

export const metadata = {
  title: "Carry Trade",
  description:
    "Calculadora y visualización de estrategias de carry trade con bonos argentinos.",
};

export const revalidate = 3600; // 1 hour

function findBest<T>(items: T[], key: keyof T): T | null {
  if (!items || items.length === 0) return null;
  return items.reduce((best, current) =>
    (current[key] as number) > (best[key] as number) ? current : best,
  );
}

interface CarryTradePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CarryTradePage({
  searchParams,
}: CarryTradePageProps) {
  const { custom_mep } = await searchParams;
  const customMep = custom_mep ? parseFloat(custom_mep as string) : undefined;

  const [carryTradeResult, carryExitSimulation] = await Promise.all([
    getCarryTradeData(customMep),
    getCarryExitSimulation(),
  ]);

  const bestCarryBond = findBest(
    carryTradeResult?.carryData ?? [],
    "carry_worst",
  );
  const bestExitBond = findBest(carryExitSimulation ?? [], "ars_tea");

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
      <h1 className="text-3xl font-bold mb-2">Carry Trade</h1>
      <p className="text-muted-foreground mb-8">
        Fijate cuál es el mejor bono para hacer carry trade. Se actualiza casi a
        tiempo real. Inspirado en el gran{" "}
        <InlineLink href="https://x.com/JohnGalt_is_www/status/1912555971400069372">
          JohnGalt_is_www
        </InlineLink>
        .
      </p>

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          {bestCarryBond && (
            <Card>
              <CardHeader>
                <CardTitle>Mejor Opción Carry (Hold)</CardTitle>
                <CardDescription>
                  Bono con mayor rendimiento estimado conservador (peor caso)
                  manteniendo hasta el vencimiento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Ticker:</strong> {bestCarryBond.symbol}
                </p>
                <p>
                  <strong>Carry en el peor de los casos:</strong>{" "}
                  <span
                    className={
                      bestCarryBond.carry_worst > 0
                        ? "text-green-600 dark:text-green-400 font-semibold"
                        : "text-red-600 dark:text-red-400 font-semibold"
                    }
                  >
                    {formatNumber(bestCarryBond.carry_worst, 2, "percentage")}
                  </span>
                </p>
                <p>
                  <strong>TEM:</strong>{" "}
                  {formatNumber(bestCarryBond.tem, 2, "percentage")}
                </p>
                <p>
                  <strong>MEP Breakeven:</strong> ${" "}
                  {formatNumber(bestCarryBond.mep_breakeven)}
                </p>
                <p>
                  <strong>Días al Vencimiento:</strong>{" "}
                  {bestCarryBond.days_to_exp}{" "}
                  <span className="text-muted-foreground font-normal">
                    {format(
                      addDays(new Date(), bestCarryBond.days_to_exp),
                      "dd/MM/yyyy",
                    )}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
          {bestExitBond && (
            <Card>
              <CardHeader>
                <CardTitle>Mejor Opción Salida Anticipada</CardTitle>
                <CardDescription>
                  Bono con mayor rendimiento anualizado simulando salida
                  temprana por compresión de tasa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Ticker:</strong> {bestExitBond.symbol}
                </p>
                <p>
                  <strong>TEA Estimada (ARS):</strong>{" "}
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {formatNumber(bestExitBond.ars_tea, 2, "percentage")}
                  </span>
                </p>
                <p>
                  <strong>Rendimiento Directo (ARS):</strong>{" "}
                  {formatNumber(bestExitBond.ars_direct_yield, 2, "percentage")}
                </p>
                <p>
                  <strong>Precio Salida Estimado:</strong> ${" "}
                  {formatNumber(bestExitBond.bond_price_out)}
                </p>
                <p>
                  <strong>Días Invertido:</strong> {bestExitBond.days_in}{" "}
                  <span className="text-muted-foreground font-normal">
                    {format(
                      addDays(new Date(), bestExitBond.days_in),
                      "dd/MM/yyyy",
                    )}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

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
              {!customMep && (
                <p className={`text-primary font-bold`}>
                  MEP Actual utilizado para los cálculos: $
                  {carryTradeResult.actualMep?.toFixed(2)}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-xs">
                Ingresá un valor del dólar personalizado:
              </span>
              <CarryExitInput />
            </div>
            <MepBreakevenChart data={carryTradeResult.carryData} />
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
