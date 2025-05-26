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
