import type { CarryExitData, CarryTradeData, MepData, ProcessedBondData, RawBondData } from '@/types/carry-trade';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

const TICKERS: Record<string, string> = {
  "S16A5": "2025-04-16",
  "S28A5": "2025-04-28",
  "S16Y5": "2025-05-16",
  "S30Y5": "2025-05-30",
  "S18J5": "2025-06-18",
  "S30J5": "2025-06-30",
  "S31L5": "2025-07-31",
  "S15G5": "2025-08-15",
  "S29G5": "2025-08-29",
  "S12S5": "2025-09-12",
  "S30S5": "2025-09-30",
  "T17O5": "2025-10-15",
  "S31O5": "2025-10-31",
  "S10N5": "2025-11-10",
  "S28N5": "2025-11-28",
  "T15D5": "2025-12-15",
  "T30E6": "2026-01-30",
  "T13F6": "2026-02-13",
  "T30J6": "2026-06-30",
  "T15E7": "2027-01-15",
  "TTM26": "2026-03-16",
  "TTJ26": "2026-06-30",
  "TTS26": "2026-09-15",
  "TTD26": "2026-12-15",
};

const PAYOFF: Record<string, number> = {
  "S16A5": 131.211, "S28A5": 130.813, "S16Y5": 136.861, "S30Y5": 136.331,
  "S18J5": 147.695, "S30J5": 146.607, "S31L5": 147.74, "S15G5": 146.794,
  "S29G5": 157.7, "S12S5": 158.977, "S30S5": 159.734, "T17O5": 158.872,
  "S31O5": 132.821, "S10N5": 122.254, "S28N5": 123.561, "T15D5": 170.838,
  "T30E6": 142.222, "T13F6": 144.966, "T30J6": 144.896,
  "T15E7": 160.777, "TTM26": 135.238, "TTJ26": 144.629, "TTS26": 152.096,
  "TTD26": 161.144,
};

const CARRY_PRICES = [1000, 1100, 1200, 1300, 1400];

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

async function getMepRate(): Promise<number> {
  const mepData = await fetchJson<MepData[]>('https://data912.com/live/mep');
  if (!mepData || mepData.length === 0) {
    console.warn("MEP data is empty or unavailable, returning 0.");
    toast.error("No se pudo obtener el dato de MEP, por favor intentá nuevamente más tarde.");
    return 0;
  }

  // Extract all close values and sort them numerically
  const allCloseValues = mepData.map(d => d.close).sort((a, b) => a - b);
  const len = allCloseValues.length;

  if (len === 0) {
    console.warn("No valid close values found in MEP data, returning 0.");
    toast.error("No se pudo obtener el dato de MEP, por favor intentá nuevamente más tarde.");
    return 0;
  }

  // Calculate median
  const mid = Math.floor(len / 2);
  if (len % 2 === 0) {
    // Even number of values: average of the two middle ones
    return (allCloseValues[mid - 1] + allCloseValues[mid]) / 2;
  } else {
    // Odd number of values: the middle one
    return allCloseValues[mid];
  }
}

async function getBondData(): Promise<RawBondData[]> {
  const [notes, bonds] = await Promise.all([
    fetchJson<RawBondData[]>('https://data912.com/live/arg_notes'),
    fetchJson<RawBondData[]>('https://data912.com/live/arg_bonds'),
  ]);
  return [...notes, ...bonds];
}

export async function getCarryTradeData(): Promise<CarryTradeData> {
  const [mep, allBonds] = await Promise.all([getMepRate(), getBondData()]);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const carryData = allBonds
    .filter(bond => TICKERS[bond.symbol]) // Filter only bonds we have data for
    .map(bond => {
      const expirationDate = parseISO(TICKERS[bond.symbol]);
      const days_to_exp = differenceInDays(expirationDate, today);

      if (days_to_exp <= 0 || !bond.c || bond.c <= 0) {
        return null; // Skip expired or invalid bonds
      }

      const payoff = PAYOFF[bond.symbol];
      const ratio = payoff / bond.c;
      const daysFactor = 365 / days_to_exp;
      const monthlyFactor = 30 / days_to_exp;

      const tna = (ratio - 1) * daysFactor;
      const tea = Math.pow(ratio, daysFactor) - 1;
      const tem = Math.pow(ratio, monthlyFactor) - 1;

      const tem_bid = bond.px_bid > 0 ? Math.pow(payoff / bond.px_bid, monthlyFactor) - 1 : NaN;
      const tem_ask = bond.px_ask > 0 ? Math.pow(payoff / bond.px_ask, monthlyFactor) - 1 : NaN;

      const finish_worst = Math.round(1400 * Math.pow(1.01, days_to_exp / 30));
      const mep_breakeven = mep * ratio;
      const carry_worst = (ratio * mep / finish_worst) - 1;

      const carries: Record<string, number> = {};
      CARRY_PRICES.forEach(price => {
        carries[`carry_${price}`] = (ratio * mep / price) - 1;
      });

      return {
        ...bond,
        bond_price: bond.c,
        payoff: payoff,
        expiration: TICKERS[bond.symbol],
        days_to_exp: days_to_exp,
        tna: tna,
        tea: tea,
        tem: tem,
        tem_bid: tem_bid,
        tem_ask: tem_ask,
        finish_worst: finish_worst,
        mep_breakeven: mep_breakeven,
        carry_worst: carry_worst,
        ...carries,
      } as ProcessedBondData;
    })
    .filter((bond): bond is ProcessedBondData => bond !== null) // Type guard
    .sort((a: ProcessedBondData, b: ProcessedBondData) => a.days_to_exp - b.days_to_exp); // Sort by days to expiration

  return { carryData, mep };
}


// --- Early Exit Simulation ---
const CPI_EST = 0.01; // Estimated general monthly interest rate (TEM)
const EST_DATE_STR = "2025-10-15"; // Exit date assumption

export async function getCarryExitSimulation(): Promise<CarryExitData[]> {
  const { carryData } = await getCarryTradeData(); // Reuse fetched & base processed data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const estDate = parseISO(EST_DATE_STR);

  const simulationData = carryData
    .map((bond: ProcessedBondData) => { // Add type for bond
      const expirationDate = parseISO(bond.expiration);
      const days_in = differenceInDays(estDate, today);
      const days_to_exp_from_exit = differenceInDays(expirationDate, estDate);

      if (days_in <= 0 || days_to_exp_from_exit <= 0) {
        return null; // Skip if exit date is past or bond expires before exit
      }

      const bond_price_out = bond.payoff / Math.pow(1 + CPI_EST, days_to_exp_from_exit / 30);
      const ars_direct_yield = bond_price_out / bond.bond_price - 1;
      const ars_tea = Math.pow(1 + ars_direct_yield, 365 / days_in) - 1;

      return {
        symbol: bond.symbol,
        days_in: days_in,
        payoff: bond.payoff,
        expiration: bond.expiration,
        days_to_exp: days_to_exp_from_exit,
        exit_TEM: CPI_EST,
        bond_price_in: bond.bond_price,
        bond_price_out: bond_price_out,
        ars_direct_yield: ars_direct_yield,
        ars_tea: ars_tea,
      } as CarryExitData;
    })
    .filter((sim): sim is CarryExitData => sim !== null) // Type guard
    .sort((a: CarryExitData, b: CarryExitData) => a.days_to_exp - b.days_to_exp);

  return simulationData;
}

export { };
