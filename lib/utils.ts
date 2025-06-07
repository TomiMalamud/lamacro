import { clsx, type ClassValue } from "clsx";
import { formatDate, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Holidays } from "./fija";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateAR(date: string): string {
  return formatDate(parseISO(date), "dd/MM/yyyy");
}

export function formatNumber(
  value: number,
  decimals: number = 2,
  type: "percentage" | "number" = "number",
  removeDecimals: boolean = true,
): string {
  const isInteger = value % 1 === 0;
  const actualDecimals = removeDecimals && isInteger ? 0 : decimals;

  if (type === "percentage") {
    const percentageValue = value * 100;
    return `${percentageValue.toLocaleString("es-AR", { minimumFractionDigits: actualDecimals, maximumFractionDigits: actualDecimals })}%`;
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

export function getNextBusinessDay(date: Date = new Date()): Date {
  const holidayDates = new Set(Holidays.map((h) => h.fecha));

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (true) {
    const dayOfWeek = nextDay.getDay();
    const dateString = nextDay.toISOString().split("T")[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateString)) {
      break;
    }

    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}
