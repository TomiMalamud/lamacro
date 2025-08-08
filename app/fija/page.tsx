import CocosLogo from "@/components/cocos-logo";
import FijaDashboard from "@/components/fija/fija-dashboard";
import {
  getBonos,
  getLetras,
  getBilleteras,
  getFondos,
  getFijaData,
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
      <FijaDashboard
        letras={letras}
        bonos={bonos}
        billeteras={billeteras}
        fondos={fondos}
        tableData={tableData}
      />
    </div>
  );
}
