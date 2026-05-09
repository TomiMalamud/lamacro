import { makeBCRARequest } from "./bcra-api-helper";

type DebtDataSource = "deudas" | "historial" | "cheques";

export class DebtDataUnavailableError extends Error {
  constructor(
    public readonly source: DebtDataSource,
    public readonly status?: number,
    cause?: unknown,
  ) {
    super(
      `BCRA ${source} data is temporarily unavailable${
        status ? ` (${status})` : ""
      }`,
      { cause },
    );
    this.name = "DebtDataUnavailableError";
  }
}

interface DeudaEntidad {
  entidad: string | null;
  situacion: number | null;
  fechaSit1: string | null;
  monto: number | null;
  diasAtrasoPago: number | null;
  refinanciaciones: boolean;
  recategorizacionOblig: boolean;
  situacionJuridica: boolean;
  irrecDisposicionTecnica: boolean;
  enRevision: boolean;
  procesoJud: boolean;
}

interface DeudaPeriodo {
  periodo: string | null;
  entidades: DeudaEntidad[] | null;
}

interface Deuda {
  identificacion: number;
  denominacion: string | null;
  periodos: DeudaPeriodo[] | null;
}

export interface DeudaResponse {
  status: number;
  results: Deuda;
}

interface HistorialEntidad {
  entidad: string | null;
  situacion: number | null;
  monto: number | null;
  enRevision: boolean;
  procesoJud: boolean;
}

interface HistorialPeriodo {
  periodo: string | null;
  entidades: HistorialEntidad[] | null;
}

interface HistorialDeuda {
  identificacion: number;
  denominacion: string | null;
  periodos: HistorialPeriodo[] | null;
}

export interface HistorialResponse {
  status: number;
  results: HistorialDeuda;
}

interface ChequeDetalle {
  nroCheque: number;
  fechaRechazo: string;
  monto: number;
  fechaPago: string | null;
  fechaPagoMulta: string | null;
  estadoMulta: string | null;
  ctaPersonal: boolean;
  denomJuridica: string | null;
  enRevision: boolean;
  procesoJud: boolean;
}

interface ChequeEntidad {
  entidad: number | null;
  detalle: ChequeDetalle[] | null;
}

interface ChequeCausal {
  causal: string | null;
  entidades: ChequeEntidad[] | null;
}

interface ChequeRechazado {
  identificacion: number;
  denominacion: string | null;
  causales: ChequeCausal[] | null;
}

export interface ChequeResponse {
  status: number;
  results: ChequeRechazado;
}

export async function fetchDeudas(id: string): Promise<DeudaResponse | null> {
  try {
    const response = await makeBCRARequest(
      `/centraldedeudores/v1.0/Deudas/${id}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new DebtDataUnavailableError("deudas", response.status);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching debt data:", error);
    if (error instanceof DebtDataUnavailableError) {
      throw error;
    }
    throw new DebtDataUnavailableError("deudas", undefined, error);
  }
}

export async function fetchHistorial(
  id: string,
): Promise<HistorialResponse | null> {
  try {
    const response = await makeBCRARequest(
      `/centraldedeudores/v1.0/Deudas/Historicas/${id}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new DebtDataUnavailableError("historial", response.status);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching historical data:", error);
    if (error instanceof DebtDataUnavailableError) {
      throw error;
    }
    throw new DebtDataUnavailableError("historial", undefined, error);
  }
}

export async function fetchCheques(id: string): Promise<ChequeResponse | null> {
  try {
    const response = await makeBCRARequest(
      `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${id}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new DebtDataUnavailableError("cheques", response.status);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching check data:", error);
    if (error instanceof DebtDataUnavailableError) {
      throw error;
    }
    throw new DebtDataUnavailableError("cheques", undefined, error);
  }
}
