import { GainersLosers } from "@/components/acciones/gainers-losers";
import { AccionesChart } from "@/components/acciones/rendimientos-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateAccumulatedInflation,
  getAccionesWithYTD,
} from "@/lib/acciones";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Acciones",
  description: "Retornos del panel líder de acciones argentinas.",
};

export default async function AccionesPage() {
  const acciones = await getAccionesWithYTD();
  const year = new Date().getFullYear();
  const inflacion = await calculateAccumulatedInflation();
  return (
    <div className="container mx-auto px-6 md:px-16 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={12} />
          Se actualiza cada 20 minutos
        </div>
        <h1 className="text-3xl font-bold">{metadata.title}</h1>
        <p className="text-muted-foreground">{metadata.description}</p>
      </div>
      <div className="space-y-8">
        <Card className="hidden sm:block">
          <CardHeader>
            <CardTitle>Rendimientos del Panel Líder en {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccionesChart acciones={acciones} inflacion={inflacion} />
          </CardContent>
        </Card>
        <div className="block sm:hidden space-y-8">
          <div className="space-y-1 mt-12">
            <h2 className="text-lg font-bold">
              Rendimientos del Panel Líder en {year}
            </h2>
            <p className="text-sm text-muted-foreground">
              Se muestran las 6 mejores y las 6 peores acciones.
              <br />
              Para ver todas, entrá desde la compu.
            </p>
          </div>
          <AccionesChart acciones={acciones} inflacion={inflacion} />
        </div>
        <GainersLosers acciones={acciones} />
      </div>
    </div>
  );
}

export const dynamic = "force-static";
export const revalidate = 1200;
