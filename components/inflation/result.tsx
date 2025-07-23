import NumberFlow from "@number-flow/react";
type InflationResultType = {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  totalIncrement: number;
  totalIncrementPercentage: number;
  monthlyAveragePercentage: number;
  annualizedPercentage: number;
};
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
            <NumberFlow
              value={totalIncrementPercentage}
              locales="es-AR"
              format={{
                style: "percent",
                signDisplay: "always",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />{" "}
            <span className="text-muted-foreground text-xl font-normal ml-1">
              <NumberFlow
                value={totalIncrement}
                locales="es-AR"
                format={{ style: "currency", currency: "ARS" }}
              />
            </span>
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            Incremento Mensual Promedio
          </p>
          <p className="text-2xl font-bold">
            <NumberFlow
              value={monthlyAveragePercentage}
              locales="es-AR"
              format={{
                style: "percent",
                maximumFractionDigits: 2,
                signDisplay: "always",
              }}
            />
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            Incremento Anualizado
          </p>
          <p className="text-2xl font-bold">
            <NumberFlow
              value={annualizedPercentage}
              locales="es-AR"
              format={{
                style: "percent",
                maximumFractionDigits: 2,
                signDisplay: "always",
              }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
