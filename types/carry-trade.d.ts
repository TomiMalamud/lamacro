export interface RawBondData {
  symbol: string;
  c: number;
  px_bid: number;
  px_ask: number;
}

export interface ProcessedBondData extends RawBondData {
  bond_price: number;
  payoff: number;
  expiration: string;
  days_to_exp: number;
  tna: number;
  tea: number;
  tem: number;
  tem_bid: number;
  tem_ask: number;
  finish_worst: number;
  mep_breakeven: number;
  carry_worst: number;
  [key: `carry_${number}`]: number;
}

export interface MepData {
  close: number;
}

export interface TamarData {
  fecha: string;
  valor: number;
}

export interface ProcessedTamarData {
  date: string;
  tamar_tem_spot: number | null;
  tamar_tem_avg: number | null;
  TTM26?: number;
  TTJ26?: number;
  TTS26?: number;
  TTD26?: number;
}


export interface CarryTradeData {
  carryData: ProcessedBondData[];
  mep: number;
}

export interface CarryExitData {
  symbol: string;
  days_in: number;
  payoff: number;
  expiration: string;
  days_to_exp: number;
  exit_TEM: number;
  bond_price_in: number;
  bond_price_out: number;
  ars_direct_yield: number;
  ars_tea: number;
}

export interface TamarChartData {
  processedTamarData: ProcessedTamarData[];
}