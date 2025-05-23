"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BCRAVariable,
  fetchVariableTimeSeries,
  formatDate,
  formatNumber,
} from "@/lib/bcra-fetch";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Global cache for trend data
const trendCache: {
  [key: string]: {
    timestamp: number;
    data: {
      direction: "up" | "down" | "neutral" | null;
      percentage: number | null;
      timeframe: 30 | 60 | null;
    };
  };
} = {};

// Cache TTL in milliseconds (6 hours)
const CACHE_TTL = 6 * 60 * 60 * 1000;

// For tracking which variables are currently being fetched
const activeFetches = new Set<number>();

// Counter for staggered loading
let loadCounter = 0;

interface TrendData {
  isLoading: boolean;
  direction: "up" | "down" | "neutral" | null;
  percentage: number | null;
  timeframe: 30 | 60 | null;
  oldestValue?: number | null;
  oldestDate?: string | null;
}

interface VariableCardProps {
  variable: BCRAVariable;
  className?: string;
  disableTrend?: boolean;
  prefetch?: boolean;
}

export function VariableCard({
  variable,
  className = "",
  disableTrend = true,
  prefetch = false,
}: VariableCardProps) {
  const [trend, setTrend] = useState<TrendData>({
    isLoading: false, // Start as not loading until we decide to load
    direction: null,
    percentage: null,
    timeframe: null,
  });
  const [shouldLoad, setShouldLoad] = useState(false);

  // First effect - decides when to start loading the trend data
  useEffect(() => {
    // Don't schedule loading if trends are disabled
    if (disableTrend) return;

    // Stagger the loading of trend data to avoid too many simultaneous requests
    const delay = (loadCounter++ % 5) * 1000; // Stagger by groups of 5, each 1000ms apart

    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [disableTrend]);

  // Second effect - loads the data once shouldLoad becomes true
  useEffect(() => {
    if (!shouldLoad) return;

    const fetchTrendData = async () => {
      // If we're already fetching this variable, don't start another fetch
      if (activeFetches.has(variable.idVariable)) return;

      setTrend((prev) => ({ ...prev, isLoading: true }));
      activeFetches.add(variable.idVariable);

      try {
        const cacheKey = `trend_${variable.idVariable}`;

        // Check if we have cached data and it's still valid
        if (
          trendCache[cacheKey] &&
          Date.now() - trendCache[cacheKey].timestamp < CACHE_TTL
        ) {
          setTrend({
            isLoading: false,
            ...trendCache[cacheKey].data,
          });
          activeFetches.delete(variable.idVariable);
          return;
        }

        const today = new Date();
        const hasta = today.toISOString().split("T")[0];
        const inflationVariableIds = [27, 28, 29];
        const isInflationVariable = inflationVariableIds.includes(
          variable.idVariable,
        );

        let desde: string;
        let limit: number;
        let initialTimeframe: 30 | 60 = 30;
        let response: { results: BCRAVariable[] } | null = null;

        // If it's an inflation variable, start directly with 60 days
        if (isInflationVariable) {
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(today.getDate() - 60);
          desde = sixtyDaysAgo.toISOString().split("T")[0];
          limit = 60; // Use 60 day limit
          initialTimeframe = 60;

          console.log(
            `Variable ${variable.idVariable} is inflation, fetching 60 days directly.`,
          );
          response = await fetchVariableTimeSeries(
            variable.idVariable,
            desde,
            hasta,
            0,
            limit,
          );
        } else {
          // Otherwise, first try with 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 28); // Use 28 for a buffer, API might need slightly more
          desde = thirtyDaysAgo.toISOString().split("T")[0];
          limit = 62; // Keep 62 for 30 day attempts

          console.log(
            `Variable ${variable.idVariable} is not inflation, trying 30 days first.`,
          );
          response = await fetchVariableTimeSeries(
            variable.idVariable,
            desde,
            hasta,
            0,
            limit,
          );

          // If we don't have enough data, try with 60 days instead
          if (!response?.results || response.results.length < 2) {
            console.log(
              `Variable ${variable.idVariable} needs 60 days, fetching again.`,
            );
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(today.getDate() - 60);
            desde = sixtyDaysAgo.toISOString().split("T")[0];
            limit = 60; // Use 60 day limit
            initialTimeframe = 60;

            response = await fetchVariableTimeSeries(
              variable.idVariable,
              desde,
              hasta,
              0,
              limit,
            );
          }
        }

        const timeframe: 30 | 60 = initialTimeframe; // Use the timeframe determined above

        let trendData = {
          direction: null as "up" | "down" | "neutral" | null,
          percentage: null as number | null,
          timeframe: null as 30 | 60 | null,
          oldestValue: null as number | null,
          oldestDate: null as string | null,
        };

        if (response?.results?.length >= 2) {
          const sortedResults = [...response.results].sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
          );

          const currentValue = variable.valor;

          // Instead of using the oldest value, find the value closest to exactly 30 or 60 days ago
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - timeframe); // Either 30 or 60 days ago
          const targetTime = targetDate.getTime();

          // Find the datapoint closest to our target date
          let closestIndex = 0;
          let closestTimeDiff = Infinity;

          for (let i = 0; i < sortedResults.length; i++) {
            const dataPointTime = new Date(sortedResults[i].fecha).getTime();
            const timeDiff = Math.abs(dataPointTime - targetTime);

            if (timeDiff < closestTimeDiff) {
              closestTimeDiff = timeDiff;
              closestIndex = i;
            }
          }

          const oldestValue = sortedResults[closestIndex].valor;
          const oldestDate = sortedResults[closestIndex].fecha;

          if (oldestValue === 0) {
            trendData = {
              direction: "neutral",
              percentage: 0,
              timeframe,
              oldestValue,
              oldestDate,
            };
          } else {
            const percentageChange =
              ((currentValue - oldestValue) / Math.abs(oldestValue)) * 100;

            trendData = {
              direction:
                percentageChange > 0.5
                  ? "up"
                  : percentageChange < -0.5
                    ? "down"
                    : "neutral",
              percentage: Math.abs(percentageChange),
              timeframe,
              oldestValue,
              oldestDate,
            };
          }
        }

        // Update cache
        trendCache[cacheKey] = {
          timestamp: Date.now(),
          data: trendData,
        };

        setTrend({
          isLoading: false,
          ...trendData,
        });
      } catch (error) {
        console.error(
          `Error fetching trend data for variable ${variable.idVariable}:`,
          error,
        );
        setTrend({
          isLoading: false,
          direction: null,
          percentage: null,
          timeframe: null,
        });
      } finally {
        activeFetches.delete(variable.idVariable);
      }
    };

    fetchTrendData();
  }, [shouldLoad, variable.idVariable, variable.valor]);

  const renderTrendIcon = () => {
    if (disableTrend || !shouldLoad) return null;

    if (trend.direction === "up") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-muted-foreground animate-fade-in">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs ml-1">
                  {formatNumber(trend.percentage || 0, 1)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Subió {formatNumber(trend.percentage || 0, 1)}%. Desde{" "}
              {formatNumber(trend.oldestValue || 0)}{" "}
              {trend.oldestDate ? `el ${formatDate(trend.oldestDate)}` : ""} a{" "}
              {formatNumber(variable.valor)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (trend.direction === "down") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-muted-foreground animate-fade-in">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs ml-1">
                  {formatNumber(trend.percentage || 0, 1)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Bajó {formatNumber(trend.percentage || 0, 1)}%. Desde{" "}
              {formatNumber(trend.oldestValue || 0)}{" "}
              {trend.oldestDate ? `el ${formatDate(trend.oldestDate)}` : ""} a{" "}
              {formatNumber(variable.valor)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (trend.direction === "neutral") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-muted-foreground animate-fade-in">
                <Minus className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Sin cambios significativos. Desde{" "}
              {formatNumber(trend.oldestValue || 0)}{" "}
              {trend.oldestDate ? `el ${formatDate(trend.oldestDate)}` : ""} a{" "}
              {formatNumber(variable.valor)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  return (
    <Link
      href={`/variables/${variable.idVariable}`}
      prefetch={prefetch}
      className="block w-full h-full"
    >
      <Card
        className={`${className} h-full cursor-pointer hover:shadow-xs dark:hover:shadow-neutral-700 white transition-all group animate-fade-in flex flex-col`}
      >
        <CardHeader className="pb-2 grow-0">
          <CardTitle className="text-sm font-medium line-clamp-2 min-h-10">
            {variable.descripcion.replace("n.a.", "TNA").replace("e.a.", "TEA")}
          </CardTitle>
          <CardDescription>
            Últ. act: {formatDate(variable.fecha)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grow flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <div className="mr-4">
              <div className="text-3xl font-bold">
                {formatNumber(variable.valor) +
                  (variable.descripcion.includes("%") ||
                  variable.descripcion.includes("Tasa")
                    ? "%"
                    : "")}
              </div>
            </div>
            {renderTrendIcon()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
