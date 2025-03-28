import { formatCurrency } from "@/lib/utils";
import { InflationResult as InflationResultType } from "./calculator";

export function InflationResult({
  totalIncrement,
  totalIncrementPercentage,
  monthlyAveragePercentage,
  annualizedPercentage
}: InflationResultType) {
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Incremento Total</p>
          <p className="text-2xl font-bold">{formatPercentage(totalIncrementPercentage)} <span className="text-muted-foreground text-xl font-normal ml-1">{formatCurrency(totalIncrement, 2)}</span></p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Incremento Mensual Promedio</p>
          <p className="text-2xl font-bold">{formatPercentage(monthlyAveragePercentage)}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Incremento Anualizado</p>
          <p className="text-2xl font-bold">{formatPercentage(annualizedPercentage)}</p>
        </div>
      </div>
    </div>
  );
} 