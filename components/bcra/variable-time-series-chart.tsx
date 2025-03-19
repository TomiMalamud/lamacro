"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BCRAVariable, formatDate, formatNumber } from "@/lib/bcra-api";
import { fetchVariableTimeSeries } from "@/lib/direct-bcra";
import { cn } from "@/lib/utils";
import { endOfDay, format, startOfDay, subMonths, subYears } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BarChartIcon,
  CalendarIcon,
  Download,
  LineChartIcon,
  TableIcon
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "../ui/chart";

// Extended interface for chart data with comparison values
interface ChartDataWithComparison extends BCRAVariable {
  prevValor?: number;
}

const chartConfig = {
  valor: {
    label: "Valor actual",
    color: "hsl(222 37% 22%)"
  },
  prevValor: {
    label: "Período anterior",
    color: "hsl(0 0% 60%)"
  }
} satisfies ChartConfig;

interface VariableTimeSeriesChartProps {
  initialData: BCRAVariable[];
  variableId: number;
  onPercentChangeUpdate?: (percentChange: number | null) => void;
}


export function VariableTimeSeriesChart({
  initialData,
  variableId,
  onPercentChangeUpdate
}: VariableTimeSeriesChartProps) {
  const [timeRange, setTimeRange] = useState<
    "1m" | "3m" | "6m" | "1y" | "all" | "custom"
  >("3m");
  const [data, setData] = useState<BCRAVariable[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<BCRAVariable[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [percentChange, setPercentChange] = useState<number | null>(null);

  useEffect(() => {
    if (onPercentChangeUpdate) {
      onPercentChangeUpdate(percentChange);
    }
  }, [percentChange, onPercentChangeUpdate]);

  // Fetch data based on date range
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

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
          const newData = response.results;
          setData(newData);

          // Calculate percentage change for custom range
          if (newData.length > 1) {
            // Sort data by date (newest first)
            const sortedData = [...newData].sort(
              (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );

            const firstValue = sortedData[sortedData.length - 1].valor; // Oldest value
            const lastValue = sortedData[0].valor; // Most recent value
            const change = lastValue - firstValue;
            const newPercentChange = (change / firstValue) * 100;
            setPercentChange(newPercentChange);
          } else {
            setPercentChange(null);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPercentChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if in custom mode and dateRange is defined
    if (timeRange === "custom" && dateRange?.from && dateRange?.to) {
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
            desde = new Date(2000, 0, 1); // Far back date
            break;
        }

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
          const newData = response.results;
          setData(newData);

          // Calculate percentage change for the current time range
          if (newData.length > 1) {
            // Sort data by date (newest first)
            const sortedData = [...newData].sort(
              (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );

            const firstValue = sortedData[sortedData.length - 1].valor; // Oldest value
            const lastValue = sortedData[0].valor; // Most recent value
            const change = lastValue - firstValue;
            const newPercentChange = (change / firstValue) * 100;
            setPercentChange(newPercentChange);
          } else {
            setPercentChange(null);
          }

          // Set default chart type based on time range
          if (timeRange === "1y" || timeRange === "all") {
            setChartType("line");
          } else {
            setChartType("bar");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPercentChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRangeData();
  }, [timeRange, variableId]);

  // Fetch comparison data when showComparison is toggled
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (
        !showComparison ||
        timeRange === "all" ||
        timeRange === "custom" ||
        !data.length
      )
        return;

      setIsLoading(true);
      try {
        const currentEnd = new Date();
        let currentStart: Date;
        let previousStart: Date;
        let previousEnd: Date;

        // Calculate date ranges based on current timeRange
        switch (timeRange) {
          case "1m":
            currentStart = subMonths(currentEnd, 1);
            previousEnd = new Date(currentStart);
            previousStart = subMonths(previousEnd, 1);
            break;
          case "3m":
            currentStart = subMonths(currentEnd, 3);
            previousEnd = new Date(currentStart);
            previousStart = subMonths(previousEnd, 3);
            break;
          case "6m":
            currentStart = subMonths(currentEnd, 6);
            previousEnd = new Date(currentStart);
            previousStart = subMonths(previousEnd, 6);
            break;
          case "1y":
            currentStart = subYears(currentEnd, 1);
            previousEnd = new Date(currentStart);
            previousStart = subYears(previousEnd, 1);
            break;
          default:
            return;
        }

        // Format dates for API query
        const desdeStr = format(startOfDay(previousStart), "yyyy-MM-dd");
        const hastaStr = format(endOfDay(previousEnd), "yyyy-MM-dd");

        // Call API with parameters
        const response = await fetchVariableTimeSeries(
          variableId,
          desdeStr,
          hastaStr
        );
        if (response && response.results) {
          setComparisonData(response.results);
        }
      } catch (error) {
        console.error("Error fetching comparison data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [showComparison, timeRange, variableId, data.length]);

  // Process data for the chart
  const chartData = useMemo(() => processDataForChart(data), [data]);

  // Generate combined data for comparison charts
  const combinedChartData = useMemo<ChartDataWithComparison[]>(() => {
    if (!showComparison || !comparisonData.length) return chartData;

    const processedComparisonData = processDataForChart(comparisonData);

    // Align dates for comparison - use index-based alignment
    return chartData.map((item, index) => {
      const prevItem =
        processedComparisonData[
        index >= processedComparisonData.length
          ? processedComparisonData.length - 1
          : index
        ];
      return {
        ...item,
        prevValor: prevItem?.valor
      };
    });
  }, [chartData, comparisonData, showComparison]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    const values = chartData.map((item) => item.valor);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;

    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      average,
      change,
      percentChange,
      min,
      max
    };
  }, [chartData]);

  // Calculate min and max for better axis display
  const axisLimits = useMemo(() => {
    if (!chartData.length) return { minValue: 0, maxValue: 0 };

    let values = chartData.map((item) => item.valor);

    // Include comparison data in min/max calculation if available
    if (showComparison && comparisonData.length) {
      values = values.concat(comparisonData.map((item) => item.valor));
    }

    const minValue = Math.min(...values) * 0.95; // Add 5% padding
    const maxValue = Math.max(...values) * 1.05; // Add 5% padding

    return { minValue, maxValue };
  }, [chartData, comparisonData, showComparison]);

  // Export data to CSV
  const exportToCSV = () => {
    setExportLoading(true);

    try {
      // Create CSV content
      const headers = showComparison
        ? ["Fecha", "Valor Actual", "Valor Período Anterior"]
        : ["Fecha", "Valor"];

      const csvContent = [
        headers.join(","),
        ...combinedChartData.map((row) => {
          const date = formatDate(row.fecha);
          const currentValue = formatNumber(row.valor).replace(",", ".");

          return showComparison && row.prevValor !== undefined
            ? [
              date,
              currentValue,
              formatNumber(row.prevValor).replace(",", ".")
            ].join(",")
            : [date, currentValue].join(",");
        })
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `datos_variable_${variableId}_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center dark:bg-[#1C1C1E] bg-white justify-between gap-2 rounded-lg p-4">
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
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy")} -{" "}
                        {format(dateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy")
                    )
                  ) : (
                    <span>Rango personalizado</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from ? dateRange.from : undefined}
                  selected={dateRange || { from: undefined, to: undefined }}
                  onSelect={(selected) => {
                    setDateRange(selected || undefined);
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
                M
              </Button>
              <Button
                variant={timeRange === "3m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("3m")}
                disabled={isLoading}
              >
                3M
              </Button>
              <Button
                variant={timeRange === "6m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("6m")}
                disabled={isLoading}
              >
                6M
              </Button>
              <Button
                variant={timeRange === "1y" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("1y")}
                disabled={isLoading}
              >
                A
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

          {/* View Type Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value) setViewMode(value as "chart" | "table");
              }}
              className="mr-2"
            >
              <ToggleGroupItem value="chart" aria-label="Chart View">
                {chartType === "bar" ? (
                  <BarChartIcon className="h-4 w-4" />
                ) : (
                  <LineChartIcon className="h-4 w-4" />
                )}
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table View">
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {viewMode === "chart" && (
              <ToggleGroup
                type="single"
                value={chartType}
                onValueChange={(value) => {
                  if (value) setChartType(value as "bar" | "line");
                }}
              >
                <ToggleGroupItem value="bar" aria-label="Bar Chart">
                  <BarChartIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="line" aria-label="Line Chart">
                  <LineChartIcon className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        <div className="w-full flex items-center justify-between mt-2">
          {/* Comparison Toggle */}
          <Button
            variant={showComparison ? "default" : "outline"}
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            disabled={
              isLoading || timeRange === "all" || timeRange === "custom"
            }
            className="mr-2"
          >
            {showComparison
              ? "Ocultar comparación"
              : "Comparar con período anterior"}
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={exportLoading || !chartData.length}
            className="hidden sm:flex"
          >
            {exportLoading ? (
              "Exportando..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] w-full flex items-center justify-center">
          <p>Cargando datos...</p>
        </div>
      ) : (
        <Tabs defaultValue="visualization" className="w-full">
          <TabsContent value="visualization" className="mt-0">
            {viewMode === "chart" ? (
              <div className="h-[350px] w-full">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Tocá el gráfico para ver el valor
                </p>
                <ChartContainer
                  config={chartConfig}
                  className="w-full h-[350px]"
                >
                  {chartType === "bar" ? (
                    <BarChart data={combinedChartData}>
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
                        domain={[axisLimits.minValue, axisLimits.maxValue]}
                        tickFormatter={(value) => formatNumber(value, 0)}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        formatter={(value: number, name: string) => {
                          // Return formatted value with appropriate label based on the data key
                          const label =
                            name === "valor"
                              ? " Valor actual"
                              : " Período anterior";
                          return [`${formatNumber(value)}`, label];
                        }}
                        labelFormatter={(label) => formatDate(label as string)}
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            nameKey="dataKey"
                          />
                        }
                      />

                      <Bar
                        dataKey="valor"
                        name="valor"
                        fill="hsl(var(--primary))"
                        barSize={20}
                      />
                      {showComparison && (
                        <Bar
                          dataKey="prevValor"
                          name="prevValor"
                          fill="hsl(0, 0%, 60%)"
                          barSize={20}
                        />
                      )}
                    </BarChart>
                  ) : (
                    <LineChart data={combinedChartData}>
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
                        domain={[axisLimits.minValue, axisLimits.maxValue]}
                        tickFormatter={(value) => formatNumber(value, 0)}
                        tick={{ fontSize: 12 }}
                      />
                      {stats && (
                        <ReferenceLine
                          y={stats.average}
                          label="Promedio"
                          stroke="rgba(255, 159, 64, 0.7)"
                          strokeDasharray="3 3"
                        />
                      )}
                      <ChartTooltip
                        formatter={(value: number, name: string) => {
                          // Return formatted value with appropriate label based on the data key
                          const label =
                            name === "valor"
                              ? " Valor actual"
                              : " Período anterior";
                          return [`${formatNumber(value)}`, label];
                        }}
                        labelFormatter={(label) => formatDate(label as string)}
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            nameKey="dataKey"
                          />
                        }
                      />
                      <Line
                        dataKey="valor"
                        name="valor"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        type="monotone"
                      />
                      {showComparison && (
                        <Line
                          dataKey="prevValor"
                          name="prevValor"
                          stroke="hsl(0, 0%, 60%)"
                          strokeWidth={2}
                          dot={false}
                          type="monotone"
                          strokeDasharray="5 5"
                        />
                      )}
                    </LineChart>
                  )}
                </ChartContainer>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      {showComparison && (
                        <TableHead className="text-right">
                          Valor período anterior
                        </TableHead>
                      )}
                      <TableHead className="text-right">Variación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedChartData.map((row, index) => {
                      const prevRowValue =
                        index > 0 ? combinedChartData[index - 1].valor : null;
                      const change =
                        prevRowValue !== null ? row.valor - prevRowValue : null;
                      const percentChange =
                        prevRowValue !== null && prevRowValue !== 0
                          ? (change! / prevRowValue) * 100
                          : null;

                      return (
                        <TableRow key={row.fecha}>
                          <TableCell>{formatDate(row.fecha)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(row.valor)}
                          </TableCell>
                          {showComparison && (
                            <TableCell className="text-right text-muted-foreground">
                              {(row as ChartDataWithComparison).prevValor !==
                                undefined
                                ? formatNumber(
                                  (row as ChartDataWithComparison).prevValor!
                                )
                                : "-"}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            {change !== null && (
                              <span>
                                {change > 0 ? (
                                  <ArrowUpIcon className="inline h-3 w-3 mr-1" />
                                ) : change < 0 ? (
                                  <ArrowDownIcon className="inline h-3 w-3 mr-1" />
                                ) : null}
                                {formatNumber(Math.abs(change), 2)}
                                {percentChange !== null && (
                                  <span className="text-xs ml-1">
                                    ({formatNumber(Math.abs(percentChange), 2)}
                                    %)
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Mostrando {chartData.length} registros • Último dato:{" "}
        {chartData[chartData.length - 1]?.fecha
          ? formatDate(chartData[chartData.length - 1].fecha)
          : "N/A"}
        {stats && ` • Promedio: ${formatNumber(stats.average, 2)}`}
        {stats &&
          ` • Variación: ${stats.percentChange > 0 ? "+" : ""}${formatNumber(
            stats.percentChange,
            2
          )}%`}
      </div>
    </div>
  );
}

// Helper function to process data for the chart
function processDataForChart(data: BCRAVariable[]): BCRAVariable[] {
  if (!data.length) return [];

  // Sort data by date (newest first)
  const sortedData = [...data].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Reverse the data for the chart (oldest first)
  return sortedData.reverse();
}
