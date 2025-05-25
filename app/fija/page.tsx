import FijaTable from "@/components/fija/FijaTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBonos, getLetras } from "@/lib/fija";

export default async function FijaPage() {
  const letras = await getLetras();
  const bonos = await getBonos();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl">Renta Fija - Análisis de Rendimientos</h1>
        <p className="">
          Análisis de letras y bonos con cálculos de TNA, TEM y TEA
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Renta Fija - Análisis de Rendimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <FijaTable letras={letras} bonos={bonos} />
        </CardContent>
      </Card>
    </div>
  );
}
