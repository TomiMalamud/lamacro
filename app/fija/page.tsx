import CocosLogo from "@/components/cocos-logo";
import FijaDashboard from "@/components/fija/fija-dashboard";
import { getBonos, getLetras } from "@/lib/fija";

export const metadata = {
  title: "Renta Fija",
  description: "Análisis de letras y bonos con cálculos de TNA, TEM y TEA",
};

export default async function FijaPage() {
  const letras = await getLetras();
  const bonos = await getBonos();

  return (
    <div className="container mx-auto px-6 md:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            {metadata.description}. Cálculos por{" "}
          </p>
          <a href="https://cocos.capital" target="_blank" rel="noopener">
            <CocosLogo className="h-8 pb-2 w-auto" />
          </a>
        </div>
      </div>
      <FijaDashboard letras={letras} bonos={bonos} />
    </div>
  );
}
