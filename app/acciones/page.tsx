import { AccionesChart } from "@/components/acciones/rendimientos-chart";
import { GainersLosers } from "@/components/acciones/gainers-losers";
import { VolumeChart } from "@/components/acciones/volume-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAccionesWithYTD } from "@/lib/acciones";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Acciones",
  description: "Retornos del panel líder de acciones argentinas.",
};

export default async function AccionesPage() {
  const acciones = await getAccionesWithYTD();
  const year = new Date().getFullYear();

  return (
    <div className="container mx-auto px-6 md:px-16 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={12} />
          Se actualiza al cierre de la rueda
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
            <AccionesChart acciones={acciones} />
          </CardContent>
        </Card>
        <div className="block sm:hidden space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-2">
              Rendimientos del Panel Líder en {year}
            </h2>
            <p className="text-sm text-muted-foreground">
              Se muestran las 6 mejores y las 6 peores acciones. Para ver todas,
              entrá desde la compu.
            </p>
          </div>
          <AccionesChart acciones={acciones} />
        </div>
        <GainersLosers acciones={acciones} />
        <Card className="hidden sm:block col-span-2">
          <CardHeader>
            <CardTitle>Volumen diario</CardTitle>
            <CardDescription>
              Volumen de acciones negociadas en la última rueda
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full">
            <VolumeChart acciones={acciones} />
          </CardContent>
        </Card>
        <div className="block sm:hidden space-y-4">
          <h2 className="text-lg font-bold">Volumen diario</h2>
          <VolumeChart acciones={acciones} />
        </div>
      </div>
    </div>
  );
}
