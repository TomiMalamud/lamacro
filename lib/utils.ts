import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatNumber(
  value: number,
  decimals: number = 2,
  type: "percentage" | "number" = "number",
): string {
  const isInteger = value % 1 === 0;
  const actualDecimals = isInteger ? 0 : decimals;

  if (type === "percentage") {
    const percentageValue = value * 100;
    const isPercentageInteger = percentageValue % 1 === 0;
    const percentageDecimals = isPercentageInteger ? 0 : decimals;
    return `${percentageValue.toLocaleString("es-AR", { minimumFractionDigits: percentageDecimals, maximumFractionDigits: percentageDecimals })}%`;
  }
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: actualDecimals,
    maximumFractionDigits: actualDecimals,
  });
}

export function formatPeriod(periodString: string | null): string {
  if (!periodString || periodString.length !== 6) return periodString || "N/A";

  const year = periodString.substring(0, 4);
  const month = parseInt(periodString.substring(4, 6));

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return `${monthNames[month - 1]} ${year}`;
}
