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
 * 
 * IMPORTANT: Using dynamic fetching for Server Components and including Argentina-specific headers
 */
export async function fetchBCRAData(): Promise<BCRAResponse> {
  try {
    let url: string;
    let origin: string;
    
    // Check if we're in the browser or on the server
    if (typeof window !== 'undefined') {
      // Client-side: use relative URL and window.location
      url = '/api/bcra';
      origin = window.location.origin;
    } else {
      // Server-side: Next.js's Node.js environment requires absolute URLs
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NODE_ENV === 'production'
          ? 'https://bcraenvivo.vercel.app'
          : 'http://localhost:3000';
          
      url = `${baseUrl}/api/bcra`;
      origin = baseUrl;
    }
        
    // Add Argentina-specific headers to our internal API request
    // This ensures we're matching the same headers pattern the API uses externally
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Content-Language': 'es-AR',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Forwarded-For': '190.191.237.1', // Common Argentina IP
        'CF-IPCountry': 'AR', // Cloudflare country header
        'Origin': origin,
        'Referer': origin,
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching BCRA data: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching BCRA data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BCRA data:', error);
    throw error;
  }
}

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

export function groupVariablesByCustomGroups(variables: BCRAVariable[]): Record<string, BCRAVariable[]> {
  const result: Record<string, BCRAVariable[]> = {};

  Object.entries(VARIABLE_GROUPS).forEach(([groupName, ids]) => {
    result[groupName] = variables.filter(v => ids.includes(v.idVariable));
  });

  return result;
}

export function getVisualizationType(variable: BCRAVariable): VisualizationType {
  const description = variable.descripcion.toLowerCase();
  
  if (VARIABLE_GROUPS.KEY_METRICS.includes(variable.idVariable)) {
    return VisualizationType.KEY_INDICATOR;
  }
  
  if (description.includes('(%)') || description.includes('percent')) {
    return VisualizationType.PERCENTAGE;
  }
  
  if (description.includes('rate') && description.includes('interest')) {
    return VisualizationType.INTEREST_RATE;
  }
  
  if (description.includes('exchange rate') || description.includes('currency')) {
    return VisualizationType.EXCHANGE_RATE;
  }
  
  if (description.includes('monetary effect')) {
    return VisualizationType.MONETARY_EFFECT;
  }
  
  if (description.includes('daily change')) {
    return VisualizationType.DAILY_CHANGE;
  }
  
  if (description.includes('balance')) {
    return VisualizationType.BALANCE;
  }
  
  if (description.includes('in million') || description.includes('pesos') || description.includes('dollars') || description.includes('ars') || description.includes('usd')) {
    return VisualizationType.MONETARY;
  }
  
  if (TIME_SERIES_CATEGORIES.includes(variable.categoria)) {
    return VisualizationType.TIME_SERIES;
  }
  
  return VisualizationType.DEFAULT;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatMonetaryValue(value: number, description: string): string {
  const isInMillions = description.toLowerCase().includes('(in million') || 
                        description.toLowerCase().includes('million');
  const isPesos = description.toLowerCase().includes('pesos') || 
                  description.toLowerCase().includes('ars') || 
                  description.toLowerCase().includes('$');
  const isDollars = description.toLowerCase().includes('dollars')
  
  let formattedValue = '';
  
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
  
  if (isPesos) {
    return `$${formattedValue}`;
  } else if (isDollars) {
    return `US$${formattedValue}`;
  }
  
  return formattedValue;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR').format(date);
}

export function getTrendIndicator(variable: BCRAVariable): 'positive' | 'negative' | 'neutral' {
  const description = variable.descripcion.toLowerCase();
  const valor = variable.valor;
  
  let isPositiveDirection = true;
  
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