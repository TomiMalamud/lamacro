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
      // Use environment variables for production, fallback to hardcoded URLs
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
      
      // Check if we're in production and got a 401 - use mock data as fallback
      if (process.env.NODE_ENV === 'production' && response.status === 401) {
        console.log('Using mock data as fallback in production due to API restrictions');
        return getMockBCRAData();
      }
      
      throw new Error(`Error fetching BCRA data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BCRA data:', error);
    
    // In production, use mock data if we can't reach the API
    if (process.env.NODE_ENV === 'production') {
      console.log('Using mock data as fallback due to fetch error');
      return getMockBCRAData();
    }
    
    throw error;
  }
}

/**
 * Provides mock BCRA data for fallback in case of API issues
 * This ensures the app continues to work even when the API is unreachable
 * Text is in Spanish to match the actual API response format
 */
function getMockBCRAData(): BCRAResponse {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    status: 200,
    results: [
      // Principales Variables
      {
        idVariable: 1,
        descripcion: "Reservas Internacionales del BCRA (en millones de dólares)",
        categoria: "Principales Variables",
        fecha: today,
        valor: 27895
      },
      {
        idVariable: 4,
        descripcion: "Tipo de Cambio Mayorista ($/USD)",
        categoria: "Principales Variables",
        fecha: today,
        valor: 950.2
      },
      {
        idVariable: 5,
        descripcion: "Tipo de Cambio Minorista ($/USD)",
        categoria: "Principales Variables",
        fecha: today,
        valor: 970.5
      },
      {
        idVariable: 6,
        descripcion: "Tasa de Política Monetaria (%)",
        categoria: "Principales Variables",
        fecha: today,
        valor: 40
      },
      {
        idVariable: 15,
        descripcion: "Base Monetaria (en millones de pesos)",
        categoria: "Principales Variables",
        fecha: today,
        valor: 15876402
      },
      
      // Inflación
      {
        idVariable: 27,
        descripcion: "IPC Nivel General. Variación mensual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 4.2
      },
      {
        idVariable: 28,
        descripcion: "IPC Nivel General. Variación interanual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 109.5
      },
      {
        idVariable: 29,
        descripcion: "IPC Nivel General. Variación acumulada anual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 60.2
      },
      {
        idVariable: 30,
        descripcion: "IPC Núcleo. Variación mensual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 3.9
      },
      {
        idVariable: 31,
        descripcion: "IPC Núcleo. Variación interanual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 102.8
      },
      {
        idVariable: 32,
        descripcion: "IPC Núcleo. Variación acumulada anual (en %)",
        categoria: "Inflación",
        fecha: today,
        valor: 58.6
      },
      
      // Tasas de interés
      {
        idVariable: 7,
        descripcion: "Tasa de LELIQ a 28 días (%)",
        categoria: "Tasas de interés",
        fecha: today,
        valor: 56.8
      },
      {
        idVariable: 8,
        descripcion: "Tasa BADLAR Bancos Privados (%)",
        categoria: "Tasas de interés",
        fecha: today,
        valor: 45.1
      },
      {
        idVariable: 9,
        descripcion: "Tasa de Pases Pasivos a 1 día (%)",
        categoria: "Tasas de interés",
        fecha: today,
        valor: 35.0
      },
      
      // Reservas
      {
        idVariable: 74,
        descripcion: "Reservas internacionales netas (en millones de dólares)",
        categoria: "Reservas",
        fecha: today,
        valor: 8523.5
      },
      {
        idVariable: 75,
        descripcion: "Reservas brutas (en millones de dólares)",
        categoria: "Reservas",
        fecha: today,
        valor: 27895
      },
      {
        idVariable: 76,
        descripcion: "Reservas de libre disponibilidad (en millones de dólares)",
        categoria: "Reservas",
        fecha: today,
        valor: 6450.2
      },
      
      // Base Monetaria
      {
        idVariable: 16,
        descripcion: "Circulación monetaria (en millones de pesos)",
        categoria: "Base Monetaria",
        fecha: today,
        valor: 12543290
      },
      {
        idVariable: 17,
        descripcion: "Efectivo en entidades financieras (en millones de pesos)",
        categoria: "Base Monetaria",
        fecha: today,
        valor: 3333112
      },
      {
        idVariable: 18,
        descripcion: "Cuenta corriente en el BCRA (en millones de pesos)",
        categoria: "Base Monetaria",
        fecha: today,
        valor: 4325678
      }
    ]
  };
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