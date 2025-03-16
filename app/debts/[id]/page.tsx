import { HistorialChart } from "@/components/deudores/debt-charts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Info } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Define types based on the API schema
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

interface DeudaResponse {
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

interface HistorialResponse {
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

interface ChequeResponse {
  status: number;
  results: ChequeRechazado;
}

// Helper function to format currency
function formatCurrency(amount: number | null): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR");
}

// Format period from YYYYMM to a more readable format (e.g., "Diciembre 2024")
function formatPeriod(periodString: string | null): string {
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

// Helper function to get situation description
function getSituacionDescription(situacion: number | null): string {
  if (situacion === null) return "No disponible";

  switch (situacion) {
    case 1:
      return "Normal";
    case 2:
      return "Riesgo bajo";
    case 3:
      return "Riesgo medio";
    case 4:
      return "Riesgo alto";
    case 5:
      return "Irrecuperable";
    case 6:
      return "Irrecuperable por disposición técnica";
    default:
      return `Situación ${situacion}`;
  }
}

// Helper function to get situation color
function getSituacionColor(situacion: number | null): string {
  if (situacion === null) return "bg-gray-200";

  switch (situacion) {
    case 1:
      return "bg-green-100 text-green-800";
    case 2:
      return "bg-yellow-100 text-yellow-800";
    case 3:
      return "bg-orange-100 text-orange-800";
    case 4:
      return "bg-red-100 text-red-800";
    case 5:
      return "bg-red-200 text-red-900";
    case 6:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100";
  }
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // Need to await params as it's a Promise in Next.js 15
  const resolvedParams = await params;
  const id: string = resolvedParams.id;
  return {
    title: `Deudas CUIT/CUIL ${id}`,
    description: `Información de deudas registradas en el BCRA para el CUIT/CUIL ${id}`,
    other: {
      // Disable telephone detection
      "format-detection": "telephone=no",
    },
  };
}

async function fetchDeudas(id: string): Promise<DeudaResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      url = `${baseUrl}/api/bcra/deudores/${id}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching debt data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching debt data:", error);
    return null;
  }
}

async function fetchHistorial(id: string): Promise<HistorialResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/historicas/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      url = `${baseUrl}/api/bcra/deudores/historicas/${id}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching historical data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return null;
  }
}

async function fetchCheques(id: string): Promise<ChequeResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/cheques/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      url = `${baseUrl}/api/bcra/deudores/cheques/${id}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching check data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching check data:", error);
    return null;
  }
}

// Add dynamic configuration for the route segment
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Create separate components for each section
function DebtSection({ deudaData }: { deudaData: DeudaResponse | null }) {
  if (!deudaData?.results.periodos?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deudas Actuales</CardTitle>
        <CardDescription>
          Período: {formatPeriod(deudaData.results.periodos[0].periodo)}. Monto
          expresado en <span className="font-bold">miles de pesos</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entidad</TableHead>
              <TableHead>Situación</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Días Atraso</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deudaData.results.periodos[0].entidades?.map(
              (entidad, entIndex) => (
                <TableRow key={entIndex}>
                  <TableCell>{entidad.entidad}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getSituacionColor(
                        entidad.situacion
                      )}`}
                    >
                      {getSituacionDescription(entidad.situacion)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(entidad.monto)}</TableCell>
                  <TableCell>{entidad.diasAtrasoPago ?? "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entidad.refinanciaciones && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Refinanciado
                        </span>
                      )}
                      {entidad.recategorizacionOblig && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                          Recategorizado
                        </span>
                      )}
                      {entidad.situacionJuridica && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          Situación Jurídica
                        </span>
                      )}
                      {entidad.irrecDisposicionTecnica && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Irrecuperable DT
                        </span>
                      )}
                      {entidad.enRevision && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          En Revisión
                        </span>
                      )}
                      {entidad.procesoJud && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Proceso Judicial
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Wrap the main component with async
export default async function DebtorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Need to await params as it's a Promise in Next.js 15
  const resolvedParams = await params;
  const id: string = resolvedParams.id;

  // Fetch data in parallel using Promise.all
  const [deudaData, historialData, chequesData] = await Promise.all([
    fetchDeudas(id),
    fetchHistorial(id),
    fetchCheques(id),
  ]);

  // If no data is found, show 404
  if (!deudaData && !historialData && !chequesData) {
    notFound();
  }

  const denominacion =
    deudaData?.results?.denominacion ||
    historialData?.results?.denominacion ||
    chequesData?.results?.denominacion ||
    "No disponible";

  return (
    <main className="min-h-screen mx-auto p-6 sm:px-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/debts/search"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ChevronLeft className="mr-1" size={16} />
            Volver a búsqueda
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Central de Deudores</h1>
        <h2 className="text-xl text-slate-700 dark:text-slate-300">
          <span className="hidden md:inline">
            CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`} -{" "}
            {denominacion}
          </span>
          <span className="md:hidden">
            CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`}
            <br />
            {denominacion}
          </span>
        </h2>
        <Alert className="mt-4 block md:hidden">
          <Info className="mr-2 size-4" />
          <AlertTitle className="font-bold mb-2">
            Página diseñada para computadoras
          </AlertTitle>
          <AlertDescription>
            Todavía el diseño para celulares no está listo, así que la mejor
            experiencia la vas a tener entrando desde la computadora. Los datos
            se muestran correctamente en el celular también.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<DebtSectionSkeleton />}>
          <DebtSection deudaData={deudaData} />
        </Suspense>

        <Suspense fallback={<ChequesSkeletonSection />}>
          {/* Cheques section */}
          <Card>
            <CardHeader>
              <CardTitle>Cheques Rechazados</CardTitle>
              <CardDescription>
                Detalle de cheques rechazados por causal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chequesData?.results.causales?.length ? (
                chequesData.results.causales.map((causal, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    <h4 className="text-lg font-medium mb-4">
                      Causal: {causal.causal}
                    </h4>
                    {causal.entidades?.map((entidad, entIndex) => (
                      <div key={entIndex} className="mb-6 last:mb-0">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">
                          Entidad: {entidad.entidad}
                        </h5>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nº Cheque</TableHead>
                              <TableHead>Fecha Rechazo</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Fecha Pago</TableHead>
                              <TableHead>Estado Multa</TableHead>
                              <TableHead>Detalles</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entidad.detalle?.map((cheque, chequeIndex) => (
                              <TableRow key={chequeIndex}>
                                <TableCell>{cheque.nroCheque}</TableCell>
                                <TableCell>
                                  {formatDate(cheque.fechaRechazo)}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(cheque.monto)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(cheque.fechaPago)}
                                </TableCell>
                                <TableCell>
                                  {cheque.estadoMulta ||
                                    (cheque.fechaPagoMulta
                                      ? "Pagada"
                                      : "Pendiente")}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {cheque.ctaPersonal && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        Cuenta Personal
                                      </span>
                                    )}
                                    {cheque.denomJuridica && (
                                      <span
                                        className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                                        title={cheque.denomJuridica}
                                      >
                                        Jurídica
                                      </span>
                                    )}
                                    {cheque.enRevision && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                        En Revisión
                                      </span>
                                    )}
                                    {cheque.procesoJud && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                        Proceso Judicial
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-4 bg-green-100 text-green-800 rounded-md text-center">
                  No existen registros de cheques rechazados para el CUIT {id}
                </div>
              )}
              <CardFooter className="text-sm text-muted-foreground mt-4">
                Estas consultas se realizan sobre la Central de cheques
                rechazados, conformada por datos recibidos diariamente de los
                bancos, que se publican sin alteraciones de acuerdo con los
                plazos dispuestos en el inciso 4 del artículo 26 de la Ley
                25.326 de Protección de los Datos Personales y con el criterio
                establecido en el punto 1.3. de la Sección 1 del Texto ordenado
                Centrales de Información. Su difusión no implica conformidad por
                parte de este Banco Central.
              </CardFooter>
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<HistorialChartSkeleton />}>
          {historialData &&
            historialData.results.periodos &&
            historialData.results.periodos.length > 0 && (
              <HistorialChart periodos={historialData.results.periodos} />
            )}
        </Suspense>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Consultas Adicionales</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Facturas y Créditos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link
                  href={`https://epyme.cajadevalores.com.ar/comportamientodepago`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Facturas de Crédito Electrónicas MiPyMEs
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información de la Caja de Valores (BYMA)
                </p>
              </div>
              <div>
                <Link
                  href={`https://servicioswww.anses.gob.ar/YHConsBCRASitio/ConsultaBCRA/InicioConsulta?cuil=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Créditos ANSES
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información de ANSES
                </p>
              </div>
              <div>
                <Link
                  href={`https://extranet.hipotecario.com.ar/procrear/entidades/situacionBCRA?cuil=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  ProCreAr
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información del Programa de Crédito Argentino
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deudas Provinciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link
                  href={`http://www.arba.gov.ar/Aplicaciones/EstadoDeuda.asp?cuit=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  ARBA
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Agencia de Recaudación de Buenos Aires
                </p>
              </div>
              <div>
                <Link
                  href="https://www.rentascordoba.gob.ar/gestiones/consulta/situacion-fiscal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Rentas Córdoba
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información de rentas de Córdoba
                </p>
              </div>
              <div>
                <Link
                  href={`http://www.dgrcorrientes.gov.ar/rentascorrientes/jsp/servicios/introConsultaBCRA.jsp?cuit=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Rentas de Corrientes
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información de rentas de Corrientes
                </p>
              </div>
              <div>
                <Link
                  href="https://www.dgrsalta.gov.ar/Inicio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Rentas de Salta
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Información de rentas de Salta
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Otros Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Link
                  href="https://rdam.mjus.gba.gob.ar/solicitudCertificado"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline block"
                >
                  Registro de Deudores Alimentarios Morosos
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  Provincia de Buenos Aires (RDAM)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground mb-8">
          <p>
            El BCRA no tiene responsabilidad alguna por los datos difundidos en
            los enlaces anteriores. La información corresponde a las respectivas
            entidades mencionadas.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4">Información Adicional</h2>

        <h3 className="font-semibold mt-4">1. Denominación del deudor</h3>
        <p>
          Nombre o razón social de la persona humana o jurídica que figura en el
          padrón de la Agencia de Recaudación y Control Aduanero (ARCA) o bien
          la que fuera registrada por la entidad informante.
        </p>

        <h3 className="font-semibold mt-4">2. Entidad</h3>
        <p>Denominación de la entidad informante.</p>

        <h3 className="font-semibold mt-4">3. Situación</h3>
        <p>
          Indica la clasificación del deudor informada por la entidad. Para más
          información, acceder al{" "}
          <Link
            className="text-blue-500 hover:underline"
            href="https://www.bcra.gob.ar/Pdfs/Texord/t-cladeu.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Texto ordenado de las normas sobre Clasificación de deudores
          </Link>
          .
        </p>

        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Situación 1:</strong> En situación normal | Cartera
            comercial y Cartera para consumo o vivienda
          </li>
          <li>
            <strong>Situación 2:</strong> Con seguimiento especial | Cartera
            comercial y Riesgo bajo | Cartera para consumo o vivienda
          </li>
          <li>
            <strong>Situación 3:</strong> Con problemas | Cartera comercial y
            Riesgo medio | Cartera para consumo o vivienda
          </li>
          <li>
            <strong>Situación 4:</strong> Con alto riesgo de insolvencia |
            Cartera comercial y Riesgo alto | Cartera para consumo o vivienda
          </li>
          <li>
            <strong>Situación 5:</strong> Irrecuperable | Cartera comercial y
            Cartera para consumo o vivienda
          </li>
        </ul>

        <h3 className="font-semibold mt-4">5. Monto</h3>
        <p>Información en miles de pesos.</p>

        <h3 className="font-semibold mt-4">
          6. Días atraso y 7. Observaciones
        </h3>
        <p>
          Según lo determinado en el punto 8. del apartado B del{" "}
          <Link
            className="text-blue-500 hover:underline"
            href="https://www.bcra.gob.ar/Pdfs/Texord/t-RI-DSF.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Texto ordenado del &quot;Régimen Informativo Contable Mensual -
            Deudores del Sistema Financiero&quot;
          </Link>
          . Para deudores de cartera de consumo o vivienda en situación distinta
          a la normal, se informan los días de atraso en casos de
          refinanciaciones, recategorización obligatoria o situación jurídica.
          La leyenda (N/A) indica &quot;No Aplicable&quot;.
        </p>

        <h3 className="font-semibold mt-4">
          8. Protección de Datos Personales
        </h3>
        <p>
          Los deudores se identifican según la Ley 25.326 de Protección de los
          Datos Personales:
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>Información sometida a revisión (artículo 16, inciso 6)</li>
          <li>
            Información sometida a proceso judicial (artículo 38, inciso 3)
          </li>
        </ul>
      </div>
    </main>
  );
}

// Add skeleton components for loading states
function DebtSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChequesSkeletonSection() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function HistorialChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}
