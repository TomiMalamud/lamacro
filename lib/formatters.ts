// Helper to format numbers as percentages
export const formatPercent = (value: number | null | undefined, digits = 1): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
};

// Helper to format currency (ARS)
export const formatARS = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
} 

export function formatCurrency(amount: number | null, decimals: number = 0): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
  }).format(amount);
}
