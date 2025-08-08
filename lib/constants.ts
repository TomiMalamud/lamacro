export const STATIC_VARIABLE_IDS = [
  // Divisas
  1, 4, 5,
  // Tasas de Interés
  6, 7, 8, 9, 11, 12, 13, 14, 34, 35, 43, 44, 45,
  // Base Monetaria
  15, 16, 17, 18, 19,
  // Depósitos
  21, 22, 23, 24,
  // Privados
  25, 26,
  // Inflación
  27, 28, 29,
  // Índices
  30, 31, 32, 40,
];

export const TICKER_PROSPECT = [
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
    ticker: "S10L5",
    fechaVencimiento: "2025-07-10",
    pagoFinal: 101.8855614,
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
    pagoFinal: 152.96,
  },
  {
    ticker: "TTD26",
    fechaVencimiento: "2026-12-15",
    pagoFinal: 161.14,
  },
];

export const HOLIDAYS = [
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
