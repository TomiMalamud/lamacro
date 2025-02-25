"use client"

import React, { useMemo, ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ChartContainer,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps
} from 'recharts';
import { 
  BCRAVariable, 
  formatNumber, 
  getVisualizationType, 
  VisualizationType,
} from '@/lib/bcra-api';

interface CategoryChartProps {
  category: string;
  variables: BCRAVariable[];
  className?: string;
  chartType?: 'line' | 'bar' | 'pie';
}

// COLORS for charts
const CHART_COLORS = [
  "#2563eb", // blue-600
  "#4f46e5", // indigo-600
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
];

// Define a type for the chart data item
interface ChartDataItem {
  name: string;
  value: number;
  fullName: string;
  date: string;
  [key: string]: string | number; // For dynamic id keys
}

export function CategoryChart({ 
  category, 
  variables, 
  className, 
  chartType = 'line' 
}: CategoryChartProps) {
  // Pick the top variables by ID to avoid chart clutter
  // Use more variables for specialized charts
  const topVariables = useMemo(() => {
    // Sort by ID for consistent display
    const sortedVars = [...variables].sort((a, b) => a.idVariable - b.idVariable);
    
    // Automatic chart type detection based on variables
    // Only include similar types of variables in the same chart for meaningful comparison
    let filtered = sortedVars;
    
    // Group by visualization type for more meaningful charts
    const firstVar = sortedVars[0];
    if (firstVar) {
      const firstType = getVisualizationType(firstVar);
      filtered = sortedVars.filter(v => getVisualizationType(v) === firstType);
    }
    
    // Limit to 8 variables max
    return filtered.slice(0, 8);
  }, [variables]);
  
  // Create chart config from variables
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    
    topVariables.forEach((variable, index) => {
      const id = `id-${variable.idVariable}`;
      config[id] = {
        label: variable.descripcion,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    
    return config;
  }, [topVariables]);
  
  // Create chart data
  const chartData = useMemo(() => {
    return topVariables.map(variable => {
      // Format the variable description to make it shorter for display
      const shortName = variable.descripcion.length > 30
        ? variable.descripcion.substring(0, 30) + '...'
        : variable.descripcion;
        
      return {
        name: shortName,
        [`id-${variable.idVariable}`]: variable.valor,
        value: variable.valor,
        fullName: variable.descripcion,
        date: variable.fecha,
      };
    });
  }, [topVariables]);
  
  // Determine the best chart type based on the variables
  const determinedChartType = useMemo(() => {
    if (chartType !== 'line') return chartType;
    
    if (topVariables.length === 0) return 'line';
    
    // Get the visualization type of the first variable to determine chart type
    const firstVar = topVariables[0];
    const visualType = getVisualizationType(firstVar);
    
    switch (visualType) {
      case VisualizationType.DAILY_CHANGE:
      case VisualizationType.MONETARY_EFFECT:
        return 'bar';
      case VisualizationType.MONETARY:
        return topVariables.length <= 5 ? 'pie' : 'bar';
      default:
        return 'line';
    }
  }, [topVariables, chartType]);
  
  // Generate Y-axis formatter based on variable type
  const yAxisFormatter = useMemo(() => {
    if (topVariables.length === 0) return (value: number) => formatNumber(value, 1);
    
    const firstVar = topVariables[0];
    const visualType = getVisualizationType(firstVar);
    
    switch (visualType) {
      case VisualizationType.PERCENTAGE:
      case VisualizationType.INTEREST_RATE:
        return (value: number) => `${formatNumber(value, 1)}%`;
      case VisualizationType.MONETARY:
        return (value: number) => {
          // Shorten large values
          if (Math.abs(value) >= 1000000) {
            return `${formatNumber(value / 1000000, 1)}B`;
          } else if (Math.abs(value) >= 1000) {
            return `${formatNumber(value / 1000, 1)}K`;
          }
          return formatNumber(value, 1);
        };
      default:
        return (value: number) => formatNumber(value, 1);
    }
  }, [topVariables]);
  
  // Custom tooltip formatter with Recharts typing
  const customTooltip = ({ active, payload }: TooltipProps<number, string>): ReactNode => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataItem; // Type with our interface
      return (
        <div className="bg-white p-2 border rounded shadow-md text-xs">
          <div>
            <p className="font-semibold">{data.fullName}</p>
            <p className="text-gray-500">Fecha: {data.date}</p>
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color || '#000' }}>
                {entry.name || ''}: {formatNumber(entry.value || 0, 2)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // If no variables, show empty state
  if (topVariables.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{category}</CardTitle>
          <CardDescription>
            No hay variables disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-400">No hay datos disponibles para esta categoría</p>
        </CardContent>
      </Card>
    );
  }
  
  // React doesn't allow multiple children in ResponsiveContainer, so we need to conditionally render
  // just one chart type at a time
  const renderChart = () => {
    if (determinedChartType === 'line') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tickFormatter={yAxisFormatter}
            width={80}
          />
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          
          {topVariables.map((variable, index) => (
            <Line
              key={variable.idVariable}
              type="monotone"
              dataKey={`id-${variable.idVariable}`}
              name={variable.descripcion.substring(0, 20) + '...'}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }
    
    if (determinedChartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tickFormatter={yAxisFormatter}
            width={80}
          />
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          
          {topVariables.map((variable, index) => (
            <Bar
              key={variable.idVariable}
              dataKey={`id-${variable.idVariable}`}
              name={variable.descripcion.substring(0, 20) + '...'}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </BarChart>
      );
    }
    
    // Pie chart is the fallback
    return (
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
        <Legend />
      </PieChart>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{category}</CardTitle>
        <CardDescription>
          Mostrando {topVariables.length} variables
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={chartConfig} 
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 