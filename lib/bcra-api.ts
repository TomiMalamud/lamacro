// Type definitions for BCRA API responses
export interface BCRAVariable {
  idVariable: number;
  descripcion: string;
  categoria: string;
  fecha: string;
  valor: number;
}

export interface BCRAResponse {
  status: number;
  results: BCRAVariable[];
}

// Loading and error states
export type BCRAData = {
  loading: boolean;
  error: string | null;
  data: BCRAVariable[];
};

// Enhanced visual categorization
export enum VisualizationType {
  KEY_INDICATOR = 'key_indicator',        // Simple number display
  PERCENTAGE = 'percentage',              // Percentage-based data
  MONETARY = 'monetary',                  // Monetary values (in pesos/dollars)
  EXCHANGE_RATE = 'exchange_rate',        // Exchange rates
  INTEREST_RATE = 'interest_rate',        // Interest rates
  BALANCE = 'balance',                    // Balance information
  TIME_SERIES = 'time_series',            // Variables that make sense in a time context
  MONETARY_EFFECT = 'monetary_effect',    // Effects on monetary base
  DAILY_CHANGE = 'daily_change',          // Daily change metrics
  DEFAULT = 'default'                     // Default fallback
}

// Define which categories should use time series visualization
const TIME_SERIES_CATEGORIES = [
  'Principales Variables'
];

// Variable groups for dashboard organization
export const VARIABLE_GROUPS = {
  KEY_METRICS: [1, 4, 5, 6, 15, 27, 28, 29], // Selected key metrics
  INTEREST_RATES: [6, 7, 8, 9, 10, 11, 12, 13, 14, 34, 35, 40, 41, 160, 161, 162],
  EXCHANGE_RATES: [4, 5, 84],
  INFLATION: [27, 28, 29, 30, 31, 32],
  RESERVES: [1, 74, 75, 76, 77],
  MONETARY_BASE: [15, 16, 17, 18, 19, 46, 64, 71, 72, 73]
};

/**
 * Fetches BCRA data using our local API proxy
 * This avoids SSL certificate validation issues
 */
export async function fetchBCRAData(): Promise<BCRAResponse> {
  try {
    let url: string;
    
    // Check if we're in the browser or on the server
    if (typeof window !== 'undefined') {
      // Client-side: use relative URL which works in both environments
      url = '/api/bcra';
    } else {
      // Server-side: Next.js's Node.js environment requires absolute URLs
      // The VERCEL_URL environment variable uses the format project-name-git-branch-username.vercel.app
      // We need to add https:// to make it a complete URL
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production'
          ? 'https://bcraenvivo.vercel.app'
          : 'http://localhost:3000';
          
      url = `${baseUrl}/api/bcra`;
    }
    
    console.log('Fetching BCRA data from:', url);
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Error fetching BCRA data: ${response.status} ${response.statusText}`);
      
      // No longer use mock data as fallback - properly throw errors instead
      throw new Error(`Error fetching BCRA data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BCRA data:', error);
    // No longer use mock data as fallback in production - let errors propagate
    throw error;
  }
}

/**
 * Groups variables by category
 */
export function groupVariablesByCategory(variables: BCRAVariable[]): Record<string, BCRAVariable[]> {
  return variables.reduce((acc, variable) => {
    const category = variable.categoria;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, BCRAVariable[]>);
}

/**
 * Groups variables by custom groups defined in VARIABLE_GROUPS
 */
export function groupVariablesByCustomGroups(variables: BCRAVariable[]): Record<string, BCRAVariable[]> {
  const result: Record<string, BCRAVariable[]> = {};

  // Create entries for each group
  Object.entries(VARIABLE_GROUPS).forEach(([groupName, ids]) => {
    result[groupName] = variables.filter(v => ids.includes(v.idVariable));
  });

  return result;
}

/**
 * Determines the appropriate visualization type for a variable based on its properties
 */
export function getVisualizationType(variable: BCRAVariable): VisualizationType {
  const description = variable.descripcion.toLowerCase();
  
  // Check if it's one of our key indicators
  if (VARIABLE_GROUPS.KEY_METRICS.includes(variable.idVariable)) {
    return VisualizationType.KEY_INDICATOR;
  }
  
  // Percentage checks
  if (description.includes('(%)') || description.includes('percent')) {
    return VisualizationType.PERCENTAGE;
  }
  
  // Interest rates
  if (description.includes('rate') && description.includes('interest')) {
    return VisualizationType.INTEREST_RATE;
  }
  
  // Exchange rates
  if (description.includes('exchange rate') || description.includes('currency')) {
    return VisualizationType.EXCHANGE_RATE;
  }
  
  // Monetary effects
  if (description.includes('monetary effect')) {
    return VisualizationType.MONETARY_EFFECT;
  }
  
  // Daily changes
  if (description.includes('daily change')) {
    return VisualizationType.DAILY_CHANGE;
  }
  
  // Balances
  if (description.includes('balance')) {
    return VisualizationType.BALANCE;
  }
  
  // Monetary values (in pesos/dollars)
  if (description.includes('in million') || description.includes('pesos') || description.includes('dollars') || description.includes('ars') || description.includes('usd')) {
    return VisualizationType.MONETARY;
  }
  
  // Time series check based on category
  if (TIME_SERIES_CATEGORIES.includes(variable.categoria)) {
    return VisualizationType.TIME_SERIES;
  }
  
  // Default fallback
  return VisualizationType.DEFAULT;
}

/**
 * Formats a number with thousand separators and specified decimal places
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a monetary value with the appropriate currency symbol
 */
export function formatMonetaryValue(value: number, description: string): string {
  const isInMillions = description.toLowerCase().includes('(in million') || 
                        description.toLowerCase().includes('million');
  const isPesos = description.toLowerCase().includes('pesos') || 
                  description.toLowerCase().includes('ars');
  const isDollars = description.toLowerCase().includes('dollars') || 
                   description.toLowerCase().includes('usd');
  
  let formattedValue = '';
  
  // Handle scaling
  if (isInMillions) {
    if (value > 1000000) {
      formattedValue = `${formatNumber(value / 1000000, 2)} B`; // Billions
    } else if (value > 1000) {
      formattedValue = `${formatNumber(value / 1000, 2)} MM`; // Millions
    } else {
      formattedValue = `${formatNumber(value, 2)} M`; // Millions
    }
  } else {
    formattedValue = formatNumber(value, 2);
  }
  
  // Add currency symbol
  if (isPesos) {
    return `$${formattedValue}`;
  } else if (isDollars) {
    return `US$${formattedValue}`;
  }
  
  return formattedValue;
}

/**
 * Formats a date string to a more readable format (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR').format(date);
}

/**
 * Gets the trend indicator (positive/negative/neutral) for a value
 * based on its context
 */
export function getTrendIndicator(variable: BCRAVariable): 'positive' | 'negative' | 'neutral' {
  const description = variable.descripcion.toLowerCase();
  const valor = variable.valor;
  
  // Default behavior: most values above 0 are positive, below 0 are negative
  let isPositiveDirection = true;
  
  // Exceptions: some metrics are better when decreasing
  if (
    description.includes('inflation') ||
    (description.includes('rate') && !description.includes('reserves'))
  ) {
    isPositiveDirection = false;
  }
  
  if (valor > 0) {
    return isPositiveDirection ? 'positive' : 'negative';
  } else if (valor < 0) {
    return isPositiveDirection ? 'negative' : 'positive';
  }
  
  return 'neutral';
} 