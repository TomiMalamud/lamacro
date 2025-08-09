import CocosLogo from "@/components/cocos-logo";
import FijaCalculator from "@/components/fija/fija-calculator";
import FijaChart from "@/components/fija/fija-chart";
import FijaTable from "@/components/fija/fija-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBilleteras,
  getBonos,
  getFijaData,
  getFondos,
  getLetras,
} from "@/lib/fija";

export const metadata = {
  title: "Renta Fija",
  description:
    "Calculadora de letras (LECAPs) y bonos (BONCAPs y duales) con cálculos de TNA, TEM y TEA",
};

async function fetchDataSafely<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    console.error("Error fetching data:", error);
    return fallback;
  }
}

export default async function FijaPage() {
  const [letras, bonos, billeteras, fondos] = await Promise.all([
    fetchDataSafely(() => getLetras(), []),
    fetchDataSafely(() => getBonos(), []),
    fetchDataSafely(() => getBilleteras(), []),
    fetchDataSafely(() => getFondos(), []),
  ]);

  const tableData = getFijaData(letras, bonos);

  if (letras.length === 0 && bonos.length === 0 && billeteras.length === 0) {
    throw new Error("All data sources failed to load");
  }

  return (
    <div className="container mx-auto px-6 md:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            {metadata.description}. Cálculos por{" "}
          </p>
          <a href="https://cocos.capital" target="_blank" rel="noopener">
            <CocosLogo className="h-8 pb-2 w-auto hidden sm:block dark:grayscale dark:invert" />
          </a>
        </div>
        <CocosLogo className="h-8 pb-2 w-auto sm:hidden block mt-2 dark:grayscale dark:invert" />
      </div>
      <div className="space-y-8">
        <FijaCalculator
          tableData={tableData}
          billeteras={billeteras}
          fondos={fondos}
        />
        <Card>
          <CardHeader>
            <CardTitle>LECAPs, BONCAPs y Duales</CardTitle>
            <CardDescription>
              Tabla completa de letras y bonos con cálculos de TNA, TEM y TEA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FijaTable tableData={tableData} />
          </CardContent>
        </Card>

        <Card className="hidden sm:block">
          <CardHeader>
            <CardTitle>TEM vs Días hasta Vencimiento</CardTitle>
            <CardDescription>
              Gráfico de dispersión que muestra la relación entre TEM y días
              hasta vencimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FijaChart data={tableData} />
          </CardContent>
        </Card>
        <div className="sm:hidden">
          <FijaChart data={tableData} />
        </div>
      </div>
    </div>
  );
}
