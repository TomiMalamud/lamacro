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
