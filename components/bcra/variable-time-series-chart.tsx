"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BCRAVariable, formatDate, formatNumber } from "@/lib/bcra-api";
import { fetchVariableTimeSeries } from "@/lib/direct-bcra";
import { cn } from "@/lib/utils";
import { endOfDay, format, startOfDay, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { BarChartIcon, CalendarIcon, LineChartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "../ui/chart";

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(222 37% 22%)"
  }
} satisfies ChartConfig;

interface VariableTimeSeriesChartProps {
  initialData: BCRAVariable[];
  variableId: number;
}

export function VariableTimeSeriesChart({
  initialData,
  variableId
}: VariableTimeSeriesChartProps) {
  const [timeRange, setTimeRange] = useState<
    "1m" | "3m" | "6m" | "1y" | "all" | "custom"
  >("3m");
  const [data, setData] = useState<BCRAVariable[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date()
  });

  // New state for chart type
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Fetch data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange.from || !dateRange.to) return;

      setIsLoading(true);
      try {
        // Format dates for API query
        const desde = format(startOfDay(dateRange.from), "yyyy-MM-dd");
        const hasta = format(endOfDay(dateRange.to), "yyyy-MM-dd");

        // Call API with parameters
        const response = await fetchVariableTimeSeries(
          variableId,
          desde,
          hasta
        );
        if (response && response.results) {
          setData(response.results);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if in custom mode
    if (timeRange === "custom" && dateRange.from && dateRange.to) {
      fetchData();
    }
  }, [timeRange, dateRange, variableId]);

  // Handle predefined time range changes
  useEffect(() => {
    const fetchRangeData = async () => {
      if (timeRange === "custom") return;

      setIsLoading(true);
      try {
        let desde: Date;
        const hasta = new Date();

        // Calculate desde based on timeRange
        switch (timeRange) {
          case "1m":
            desde = subMonths(hasta, 1);
            break;
          case "3m":
            desde = subMonths(hasta, 3);
            break;
          case "6m":
            desde = subMonths(hasta, 6);
            break;
          case "1y":
            desde = subYears(hasta, 1);
            break;
          case "all":
          default:
            // For 'all', we don't set a desde param
            desde = new Date(2000, 0, 1); // Far back date
            break;
        }

        // Update date range silently (without triggering the custom effect)
        setDateRange({
          from: desde,
          to: hasta
        });

        // Format dates for API query
        const desdeStr = format(startOfDay(desde), "yyyy-MM-dd");
        const hastaStr = format(endOfDay(hasta), "yyyy-MM-dd");

        // Call API with parameters
        const response = await fetchVariableTimeSeries(
          variableId,
          desdeStr,
          hastaStr
        );
        if (response && response.results) {
          setData(response.results);

          // Set default chart type based on time range
          if (timeRange === "1y" || timeRange === "all") {
            setChartType("line");
          } else {
            setChartType("bar");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRangeData();
  }, [timeRange, variableId]);

  // Process data for the chart
  const chartData = processDataForChart(data);

  // Calculate min and max for better axis display
  const values = chartData.map((item) => item.valor);
  const minValue = Math.min(...values) * 0.95; // Add 5% padding
  const maxValue = Math.max(...values) * 1.05; // Add 5% padding

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Calendar date picker */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Calendar date picker */}
          <div className="w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={timeRange === "custom" ? "default" : "outline"}
                  size="sm"
                  disabled={isLoading}
                  onClick={() => setTimeRange("custom")}
                  className={cn(
                    "justify-start text-left font-normal w-full sm:w-auto",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy")} -{" "}
                        {format(dateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy")
                    )
                  ) : (
                    <span>Seleccionar fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(selected) => {
                    setDateRange(
                      selected || { from: undefined, to: undefined }
                    );
                    if (selected) setTimeRange("custom");
                  }}
                  locale={es}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Presets */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            <p className="text-sm text-muted-foreground w-full sm:w-auto sm:ml-4">
              Predefinido
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={timeRange === "1m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("1m")}
                disabled={isLoading}
              >
                1 Mes
              </Button>
              <Button
                variant={timeRange === "3m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("3m")}
                disabled={isLoading}
              >
                3 Meses
              </Button>
              <Button
                variant={timeRange === "6m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("6m")}
                disabled={isLoading}
              >
                6 Meses
              </Button>
              <Button
                variant={timeRange === "1y" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("1y")}
                disabled={isLoading}
              >
                1 Año
              </Button>
              <Button
                variant={timeRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("all")}
                disabled={isLoading}
              >
                Máx
              </Button>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <ToggleGroup
            type="single"
            value={chartType}
            onValueChange={(value) => {
              if (value) setChartType(value as "bar" | "line");
            }}
            className="ml-auto"
          >
            <ToggleGroupItem value="bar" aria-label="Bar Chart">
              <BarChartIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="line" aria-label="Line Chart">
              <LineChartIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Tocá el gráfico para ver el valor
      </p>
      {isLoading ? (
        <div className="h-[200px] w-full flex items-center justify-center">
          <p>Cargando datos...</p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ChartContainer
            config={chartConfig}
            className="min-h-[200px] w-full h-[300px]"
          >
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}/${d
                      .getFullYear()
                      .toString()
                      .substr(2, 2)}`;
                  }}
                  minTickGap={30}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[minValue, maxValue]}
                  tickFormatter={(value) => formatNumber(value, 0)}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  formatter={(value: number) => [formatNumber(value, 2)]}
                  labelFormatter={(label) => formatDate(label as string)}
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="valor"
                  name="Valor"
                  fill="hsl(222 37% 22%)"
                  barSize={20}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}/${d
                      .getFullYear()
                      .toString()
                      .substr(2, 2)}`;
                  }}
                  minTickGap={30}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[minValue, maxValue]}
                  tickFormatter={(value) => formatNumber(value, 0)}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  formatter={(value: number) => [formatNumber(value, 2)]}
                  labelFormatter={(label) => formatDate(label as string)}
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line
                  dataKey="valor"
                  name="Valor"
                  stroke="hsl(222 37% 22%)"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </LineChart>
            )}
          </ChartContainer>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Mostrando {chartData.length} registros • Último dato:{" "}
        {chartData[chartData.length - 1]?.fecha
          ? formatDate(chartData[chartData.length - 1].fecha)
          : "N/A"}
      </div>
    </div>
  );
}

// Helper function to process data for the chart
function processDataForChart(data: BCRAVariable[]): BCRAVariable[] {
  // Sort data by date (newest first)
  const sortedData = [...data].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Reverse the data for the chart (oldest first)
  return sortedData.reverse();
}
