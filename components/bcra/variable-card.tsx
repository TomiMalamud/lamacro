"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  BCRAVariable,
  formatDate,
  formatMonetaryValue,
  formatNumber,
  getTrendIndicator,
  getVisualizationType,
  VisualizationType
} from "@/lib/bcra-api";
import { ArrowDown, ArrowRight, ArrowUp, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

interface VariableCardProps {
  variable: BCRAVariable;
  className?: string;
}

export function VariableCard({ variable, className }: VariableCardProps) {
  const router = useRouter();

  // Get the visualization type for this variable
  const visualizationType = getVisualizationType(variable);

  // Get trend indicator for styling
  const trend = getTrendIndicator(variable);

  // Format value based on visualization type
  let formattedValue = "";
  let subtitle = "";

  switch (visualizationType) {
    case VisualizationType.PERCENTAGE:
      formattedValue = `${formatNumber(variable.valor, 2)}%`;
      subtitle = "Porcentaje";
      break;

    case VisualizationType.MONETARY:
      formattedValue = formatMonetaryValue(
        variable.valor,
        variable.descripcion
      );
      subtitle = variable.descripcion.toLowerCase().includes("dollar")
        ? "USD"
        : "ARS";
      break;

    case VisualizationType.EXCHANGE_RATE:
      formattedValue = `$${formatNumber(variable.valor, 2)}`;
      subtitle = "Tipo de Cambio";
      break;

    case VisualizationType.INTEREST_RATE:
      formattedValue = `${formatNumber(variable.valor, 2)}%`;
      subtitle = "Tasa de Interés";
      break;

    case VisualizationType.DAILY_CHANGE:
      // Format with a sign prefix for clarity
      formattedValue =
        variable.valor >= 0
          ? `+${formatNumber(variable.valor, 2)}`
          : formatNumber(variable.valor, 2);
      subtitle = "Cambio Diario";
      break;

    default:
      // Default formatting based on simple rules
      const isPercentage =
        variable.descripcion.toLowerCase().includes("(%)") ||
        variable.descripcion.toLowerCase().includes("tasa");

      const isInMillions =
        variable.descripcion.toLowerCase().includes("(in million") ||
        variable.descripcion.toLowerCase().includes("million");

      formattedValue = isPercentage
        ? `${formatNumber(variable.valor, 2)}%`
        : isInMillions
        ? `${formatNumber(variable.valor / 1000, 2)} B` // Convert to billions for readability
        : formatNumber(variable.valor, 2);
      break;
  }

  // Handle click to navigate to detail page
  const handleCardClick = () => {
    router.push(`/variable/${variable.idVariable}`);
  };

  return (
    <Card
      className={`${className} cursor-pointer transition-all group dark:bg-[#1C1C1E]`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-start">
          <span>{variable.descripcion}</span>
        </CardTitle>
        <CardDescription>
          Últ. act: {formatDate(variable.fecha)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div
            className={`text-2xl font-bold ${
              trend === "positive"
                ? "text-green-600"
                : trend === "negative"
                ? "text-red-600"
                : ""
            }`}
          >
            {formattedValue}
          </div>

          {/* Trend indicator icon */}
          {visualizationType === VisualizationType.DAILY_CHANGE && (
            <>
              {trend === "positive" && (
                <ArrowUp className="h-4 w-4 text-green-600" />
              )}
              {trend === "negative" && (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              {trend === "neutral" && (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
        </div>

        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}

        <div className="text-xs flex items-center gap-2 text-primary mt-4">
          Ver detalle
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-all"
          />
        </div>
      </CardContent>
    </Card>
  );
}
