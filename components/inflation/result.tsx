import { formatNumber } from "@/lib/utils";
import { InflationResult as InflationResultType } from "./calculator";

export function InflationResult({
  totalIncrement,
  totalIncrementPercentage,
  monthlyAveragePercentage,
  annualizedPercentage,
}: InflationResultType) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Incremento Total</p>
          <p className="text-2xl font-bold">
            {formatNumber(totalIncrementPercentage, 2, "percentage")}{" "}
            <span className="text-muted-foreground text-xl font-normal ml-1">
              $ {formatNumber(totalIncrement)}
            </span>
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            Incremento Mensual Promedio
          </p>
          <p className="text-2xl font-bold">
            {formatNumber(monthlyAveragePercentage, 2, "percentage")}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            Incremento Anualizado
          </p>
          <p className="text-2xl font-bold">
            {formatNumber(annualizedPercentage, 2, "percentage")}
          </p>
        </div>
      </div>
    </div>
  );
}
