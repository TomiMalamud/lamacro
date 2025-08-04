export interface SecurityData {
  symbol: string;
  q_bid: number;
  px_bid: number;
  px_ask: number;
  q_ask: number;
  v: number;
  q_op: number;
  c: number;
  pct_change: number;
}

export interface FijaTableRow {
  ticker: string;
  fechaVencimiento: string;
  dias: number;
  meses: number;
  px: number;
  pagoFinal: number;
  tna: number;
  tem: number;
  tea: number;
}

export interface ComparatasasOption {
  prettyName: string;
  tna: number;
  limit: number | null;
  type: string;
  prettyType: string;
  logoUrl: string;
  url: string;
  currency: string;
  fundName?: string;
}

export interface FundData {
  nombre: string;
  patrimonio: number;
  ultimoVcp: number;
  penultimoVcp: number;
  days: number;
  ultimoDate: string;
  penultimoDate: string;
  tna: number;
}

import { ComboboxDrawerOption } from "@/components/ui/combobox-drawer";

export interface AlternativeOption extends ComboboxDrawerOption<string> {
  tna: number | null;
  logoUrl: string | null;
  limit: number | null;
}
