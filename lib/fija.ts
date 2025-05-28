import { ComparatasasOption } from "@/types/fija";

export async function getLetras() {
  const response = await fetch("https://data912.com/live/arg_notes", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}

export async function getBonos() {
  const response = await fetch("https://data912.com/live/arg_bonds", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}

export async function getBilleteras() {
  const response = await fetch(
    "https://api.comparatasas.ar/cuentas-y-billeteras",
    {
      next: { revalidate: 21600 },
    },
  );
  const data = await response.json();
  const filteredData = data.filter(
    (item: ComparatasasOption) => item.currency === "ARS",
  );
  return filteredData;
}

export async function getFondos() {
  const response = await fetch(
    "https://api.comparatasas.ar/funds/rm?name=Cocos%20Daruma%20Renta%20Mixta%20-%20Clase%20A",
    {
      next: { revalidate: 21600 },
    },
  );
  const data = await response.json();
  return data;
}

export const Holidays = [
  {
    fecha: "2025-01-01",
    tipo: "inamovible",
    nombre: "Año nuevo",
  },
  {
    fecha: "2025-03-03",
    tipo: "inamovible",
    nombre: "Carnaval",
  },
  {
    fecha: "2025-03-04",
    tipo: "inamovible",
    nombre: "Carnaval",
  },
  {
    fecha: "2025-03-24",
    tipo: "inamovible",
    nombre: "Día Nacional de la Memoria por la Verdad y la Justicia",
  },
  {
    fecha: "2025-04-02",
    tipo: "inamovible",
    nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas",
  },
  {
    fecha: "2025-04-18",
    tipo: "inamovible",
    nombre: "Viernes Santo",
  },
  {
    fecha: "2025-05-01",
    tipo: "inamovible",
    nombre: "Día del Trabajador",
  },
  {
    fecha: "2025-05-02",
    tipo: "puente",
    nombre: "Puente turístico no laborable",
  },
  {
    fecha: "2025-05-25",
    tipo: "inamovible",
    nombre: "Día de la Revolución de Mayo",
  },
  {
    fecha: "2025-06-16",
    tipo: "trasladable",
    nombre: "Paso a la Inmortalidad del General Martín Güemes",
  },
  {
    fecha: "2025-06-20",
    tipo: "inamovible",
    nombre: "Paso a la Inmortalidad del General Manuel Belgrano",
  },
  {
    fecha: "2025-07-09",
    tipo: "inamovible",
    nombre: "Día de la Independencia",
  },
  {
    fecha: "2025-08-15",
    tipo: "puente",
    nombre: "Puente turístico no laborable",
  },
  {
    fecha: "2025-08-17",
    tipo: "trasladable",
    nombre: "Paso a la Inmortalidad del Gral. José de San Martín",
  },
  {
    fecha: "2025-10-12",
    tipo: "trasladable",
    nombre: "Día del Respeto a la Diversidad Cultural",
  },
  {
    fecha: "2025-11-21",
    tipo: "puente",
    nombre: "Puente turístico no laborable",
  },
  {
    fecha: "2025-11-24",
    tipo: "trasladable",
    nombre: "Día de la Soberanía Nacional",
  },
  {
    fecha: "2025-12-08",
    tipo: "inamovible",
    nombre: "Día de la Inmaculada Concepción de María",
  },
  {
    fecha: "2025-12-25",
    tipo: "inamovible",
    nombre: "Navidad",
  },
];

export const FIJA_TABLE_CONFIG = [
  {
    ticker: "TZXY5",
    fechaVencimiento: "2025-05-30",
    pagoFinal: 121.16,
  },
  {
    ticker: "S30Y5",
    fechaVencimiento: "2025-05-30",
    pagoFinal: 136.33,
  },
  {
    ticker: "S18J5",
    fechaVencimiento: "2025-06-18",
    pagoFinal: 147.7,
  },
  {
    ticker: "TZX25",
    fechaVencimiento: "2025-06-30",
    pagoFinal: 243.99,
  },
  {
    ticker: "S30J5",
    fechaVencimiento: "2025-06-30",
    pagoFinal: 146.61,
  },
  {
    ticker: "S31L5",
    fechaVencimiento: "2025-07-31",
    pagoFinal: 147.74,
  },
  {
    ticker: "S15G5",
    fechaVencimiento: "2025-08-18",
    pagoFinal: 146.79,
  },
  {
    ticker: "S29G5",
    fechaVencimiento: "2025-08-29",
    pagoFinal: 157.7,
  },
  {
    ticker: "S12S5",
    fechaVencimiento: "2025-09-12",
    pagoFinal: 158.98,
  },
  {
    ticker: "S30S5",
    fechaVencimiento: "2025-09-30",
    pagoFinal: 159.73,
  },
  {
    ticker: "T17O5",
    fechaVencimiento: "2025-10-15",
    pagoFinal: 158.47,
  },
  {
    ticker: "S31O5",
    fechaVencimiento: "2025-10-31",
    pagoFinal: 132.82,
  },
  {
    ticker: "S10N5",
    fechaVencimiento: "2025-11-10",
    pagoFinal: 122.25,
  },
  {
    ticker: "S28N5",
    fechaVencimiento: "2025-11-28",
    pagoFinal: 123.56,
  },
  {
    ticker: "T15D5",
    fechaVencimiento: "2025-12-15",
    pagoFinal: 170.84,
  },
  {
    ticker: "T30E6",
    fechaVencimiento: "2026-01-30",
    pagoFinal: 142.22,
  },
  {
    ticker: "T13F6",
    fechaVencimiento: "2026-02-13",
    pagoFinal: 144.97,
  },
  {
    ticker: "T30J6",
    fechaVencimiento: "2026-06-30",
    pagoFinal: 144.9,
  },
  {
    ticker: "TO26",
    fechaVencimiento: "2026-01-19",
    pagoFinal: 161.1,
  },
  {
    ticker: "T15E7",
    fechaVencimiento: "2027-01-15",
    pagoFinal: 161.1,
  },
  {
    ticker: "TTM26",
    fechaVencimiento: "2026-03-16",
    pagoFinal: 135.24,
  },
  {
    ticker: "TTJ26",
    fechaVencimiento: "2026-06-30",
    pagoFinal: 144.63,
  },
  {
    ticker: "TTS26",
    fechaVencimiento: "2026-09-16",
    pagoFinal: 152.08,
  },
  {
    ticker: "TTD26",
    fechaVencimiento: "2026-12-15",
    pagoFinal: 161.14,
  },
];

export function calculateDaysDifference(
  endDate: Date,
  startDate: Date,
): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function calculateDays360(endDate: Date, startDate: Date): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const startDay = startDate.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;
  const endDay = endDate.getDate();

  const adjustedStartDay = startDay === 31 ? 30 : startDay;
  const adjustedEndDay = endDay === 31 && adjustedStartDay >= 30 ? 30 : endDay;

  return (
    (endYear - startYear) * 360 +
    (endMonth - startMonth) * 30 +
    (adjustedEndDay - adjustedStartDay)
  );
}

export function calculateTNA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return ((pagoFinal / px - 1) / dias) * 365;
}

export function calculateTEM(
  pagoFinal: number,
  px: number,
  meses: number,
): number {
  return Math.pow(pagoFinal / px, 1 / meses) - 1;
}

export function calculateTEA(
  pagoFinal: number,
  px: number,
  dias: number,
): number {
  return Math.pow(pagoFinal / px, 365 / dias) - 1;
}
