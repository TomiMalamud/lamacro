"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
  // New props for rate pair display
  ratePair?: boolean;
  secondVariable?: BCRAVariable;
}

export function VariableCard({
  variable,
  className,
  ratePair = false,
  secondVariable
}: VariableCardProps) {
  const router = useRouter();

  // If this is a rate pair card, render the specialized view
  if (ratePair && secondVariable) {
    return (
      <RatePairCard tna={variable} tea={secondVariable} className={className} />
    );
  }

  // Regular variable card rendering continues here...

  // Get the visualization type for this variable
  const visualizationType = getVisualizationType(variable);

  // Get trend indicator for styling
  const trend = getTrendIndicator(variable);

  // Format value based on visualization type
  let formattedValue = "";

  switch (visualizationType) {
    case VisualizationType.PERCENTAGE:
      formattedValue = `${formatNumber(variable.valor, 2)}%`;
      break;

    case VisualizationType.MONETARY:
      formattedValue = formatMonetaryValue(
        variable.valor,
        variable.descripcion
      );
      break;

    case VisualizationType.EXCHANGE_RATE:
      formattedValue = `$${formatNumber(variable.valor, 2)}`;
      break;

    case VisualizationType.INTEREST_RATE:
      formattedValue = `${formatNumber(variable.valor, 2)}%`;
      break;

    case VisualizationType.DAILY_CHANGE:
      // Format with a sign prefix for clarity
      formattedValue =
        variable.valor >= 0
          ? `+${formatNumber(variable.valor, 2)}`
          : formatNumber(variable.valor, 2);
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
      className={`${className} cursor-pointer hover:shadow-sm transition-all group animate-fade-in`}
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

// Rate Pair Card section - defining router inside the component
const RatePairCard = ({
  tna,
  tea,
  className
}: {
  tna: BCRAVariable;
  tea: BCRAVariable;
  className?: string;
}) => {
  const router = useRouter();

  // Extract title from TNA description
  const title = tna.descripcion
    .split("(")[0]
    .trim()
    .replace(/, TNA/g, "")
    .replace(/,TNA/g, "");

  // Handle click to navigate to detail page
  const handleCardClick = () => {
    router.push(`/variable/${tna.idVariable}`);
  };

  return (
    <TooltipProvider>
      <Card
        className={`${
          className || ""
        } h-full hover:shadow-sm cursor-pointer transition-all animate-fade-in`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{formatDate(tna.fecha)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-x-8 flex items-center">
            <div>
              <div className="text-sm font-medium">
                TNA
                <Tooltip>
                  <TooltipTrigger className="ml-1 cursor-help text-muted-foreground">
                    (?)
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasa Nominal Anual</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(tna.valor, 2)}%
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">
                TEA
                <Tooltip>
                  <TooltipTrigger className="ml-1 cursor-help text-muted-foreground">
                    (?)
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasa Efectiva Anual</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(tea.valor, 2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
