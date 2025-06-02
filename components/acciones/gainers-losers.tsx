import { Accion } from "@/lib/acciones";
import { cn, formatNumber } from "@/lib/utils";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "../ui/card";

interface GainersLosersProps {
  acciones: Accion[];
}

export function GainersLosers({ acciones }: GainersLosersProps) {
  const gainers = acciones
    .filter((accion) => accion.pct_change > 0)
    .sort((a, b) => b.pct_change - a.pct_change)
    .slice(0, 5);

  const losers = acciones
    .filter((accion) => accion.pct_change < 0)
    .sort((a, b) => a.pct_change - b.pct_change)
    .slice(0, 5);

  const renderAccionList = (
    acciones: Accion[],
    title: string,
    colorClass: string,
  ) => (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Top {title}</h3>

      <div className="space-y-2">
        {acciones.map((accion, index) => (
          <div
            key={accion.symbol}
            className={cn(
              "border-b pb-3",
              index === acciones.length - 1 && "border-b-0",
            )}
          >
            <div className="flex justify-between">
              <span className="font-semibold">{accion.symbol}</span>
              <span className="font-bold">
                {formatNumber(accion.c, 2, "number", false)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {accion.name}
              </span>
              <span
                className={`font-bold text-xs text-white ${colorClass} px-2 py-0.5 rounded-md`}
              >
                {accion.pct_change > 0 ? "+" : ""}
                {formatNumber(accion.pct_change / 100, 2, "percentage")}
              </span>
            </div>
          </div>
        ))}
        {acciones.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No hay {title.toLowerCase()}
          </p>
        )}
        {acciones.length < 5 && (
          <p className="text-sm mt-4 bg-muted px-4 py-2 rounded-lg text-muted-foreground">
            Mostrando los únicos {acciones.length} {title.toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Ganadores y Perdedores</CardTitle>
        <CardDescription>De la última rueda</CardDescription>
      </CardHeader>
      <CardContent className="gap-8 md:gap-16 grid grid-cols-1 md:grid-cols-2">
        {renderAccionList(gainers, "Ganadores", "bg-[#35C759]")}
        {renderAccionList(losers, "Perdedores", "bg-[#FF3B2F]")}
      </CardContent>
    </Card>
  );
}
