import { ClipboardLink } from "@/components/debts/copy-link";
import { HistorialChart } from "@/components/debts/debt-chart";
import DebtMobile from "@/components/debts/debt-mobile";
import DebtSection from "@/components/debts/debt-table";
import { SearchForm } from "@/components/debts/search-form";
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
import { formatDate } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatNumber } from "@/lib/utils";

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

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/bcra/deudores/${id}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/bcra/deudores/historicas/${id}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/bcra/deudores/cheques/${id}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 },
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

async function DebtorData({ id }: { id: string }) {
  const [deudaData, historialData, chequesData] = await Promise.all([
    fetchDeudas(id),
    fetchHistorial(id),
    fetchCheques(id),
  ]);

  const hasData = deudaData || historialData || chequesData;

  return (
    <>
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
        {hasData ? (
          <h2 className="text-xl text-slate-700 dark:text-slate-300">
            <span className="hidden md:inline">
              CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`} -
              <span className="animate-fade-in">
                {" "}
                {deudaData?.results?.denominacion ||
                  historialData?.results?.denominacion ||
                  chequesData?.results?.denominacion ||
                  "No disponible"}
              </span>
            </span>
            <span className="md:hidden">
              CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`}
              <br />
              {deudaData?.results?.denominacion ||
                historialData?.results?.denominacion ||
                chequesData?.results?.denominacion ||
                "No disponible"}
            </span>
          </h2>
        ) : (
          <h2 className="text-xl text-slate-700 dark:text-slate-300">
            CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`}
          </h2>
        )}
      </div>

      {!hasData ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-amber-600">
              CUIT/CUIL no encontrado
            </CardTitle>
            <CardDescription>
              No se encontraron registros para este número en la Central de
              Deudores del BCRA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="mb-2">Posibles razones:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>El CUIT/CUIL ingresado no existe o es incorrecto</li>
                  <li>
                    La persona o entidad no tiene deudas registradas en el
                    sistema financiero
                  </li>
                </ul>
              </div>
              <div className="border-t">
                <div className="max-w-md mt-6">
                  <SearchForm initialValue={id} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="hidden md:block">
            <DebtSection deudaData={deudaData} />
          </div>
          <div className="block md:hidden">
            <DebtMobile deudaData={deudaData} />
          </div>

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
                                  {formatDate(
                                    cheque.fechaRechazo,
                                    "dd/MM/yyyy",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatNumber(cheque.monto, 2)}
                                </TableCell>
                                {cheque.fechaPago && (
                                  <TableCell>
                                    {formatDate(cheque.fechaPago, "dd/MM/yyyy")}
                                  </TableCell>
                                )}
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

          {historialData &&
            historialData.results.periodos &&
            historialData.results.periodos.length > 0 && (
              <HistorialChart periodos={historialData.results.periodos} />
            )}
        </div>
      )}

      {hasData && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Consultas Adicionales</h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Facturas y Créditos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClipboardLink
                  href="https://epyme.cajadevalores.com.ar/comportamientodepago"
                  id={id}
                  description="Información de la Caja de Valores (BYMA)"
                >
                  Facturas de Crédito Electrónicas MiPyMEs
                </ClipboardLink>
                <ClipboardLink
                  href={`https://servicioswww.anses.gob.ar/YHConsBCRASitio/ConsultaBCRA/InicioConsulta?cuil=${id}`}
                  description="Información de ANSES"
                >
                  Créditos ANSES
                </ClipboardLink>
                <ClipboardLink
                  href={`https://extranet.hipotecario.com.ar/procrear/entidades/situacionBCRA?cuil=${id}`}
                  description="Información del Programa de Crédito Argentino"
                >
                  ProCreAr
                </ClipboardLink>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deudas Provinciales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClipboardLink
                  href={`http://www.arba.gov.ar/Aplicaciones/EstadoDeuda.asp?cuit=${id}`}
                  description="Agencia de Recaudación de Buenos Aires"
                >
                  ARBA
                </ClipboardLink>
                <ClipboardLink
                  href="https://www.rentascordoba.gob.ar/gestiones/consulta/situacion-fiscal"
                  id={id}
                  description="Información de rentas de Córdoba"
                >
                  Rentas Córdoba
                </ClipboardLink>
                <ClipboardLink
                  href={`http://www.dgrcorrientes.gov.ar/rentascorrientes/jsp/servicios/introConsultaBCRA.jsp?cuit=${id}`}
                  description="Información de rentas de Corrientes"
                >
                  Rentas de Corrientes
                </ClipboardLink>
                <ClipboardLink
                  href="https://www.dgrsalta.gov.ar/Inicio"
                  id={id}
                  description="Información de rentas de Salta"
                >
                  Rentas de Salta
                </ClipboardLink>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Otros Registros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClipboardLink
                  href="https://rdam.mjus.gba.gob.ar/solicitudCertificado"
                  id={id}
                  description="Provincia de Buenos Aires (RDAM)"
                >
                  Registro de Deudores Alimentarios Morosos
                </ClipboardLink>
                <ClipboardLink
                  href="https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do"
                  id={id}
                  description="Agencia Federal de Ingresos Públicos"
                >
                  Constancia de Inscripción en ARCA
                </ClipboardLink>
                <ClipboardLink
                  href="https://central-deudores.inaes.gob.ar/cdeudores/"
                  id={id}
                  description="Instituto Nacional de Asociativismo y Economía Social"
                >
                  INAES. Servicios de Crédito Cooperativo y/o Ayuda Económica
                  Mutual
                </ClipboardLink>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground mb-8">
            <p>
              El BCRA no tiene responsabilidad alguna por los datos difundidos
              en los enlaces anteriores. La información corresponde a las
              respectivas entidades mencionadas.
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-4">Información Adicional</h2>

          <h3 className="font-semibold mt-4">1. Denominación del deudor</h3>
          <p>
            Nombre o razón social de la persona humana o jurídica que figura en
            el padrón de la Agencia de Recaudación y Control Aduanero (ARCA) o
            bien la que fuera registrada por la entidad informante.
          </p>

          <h3 className="font-semibold mt-4">2. Entidad</h3>
          <p>Denominación de la entidad informante.</p>

          <h3 className="font-semibold mt-4">3. Situación</h3>
          <p>
            Indica la clasificación del deudor informada por la entidad. Para
            más información, acceder al{" "}
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
          <p>Información en pesos.</p>

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
            . Para deudores de cartera de consumo o vivienda en situación
            distinta a la normal, se informan los días de atraso en casos de
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
      )}
    </>
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

  return (
    <main className="min-h-screen mx-auto p-6 sm:px-16">
      <Suspense
        fallback={
          <>
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
                <span>
                  CUIT: {`${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`}
                </span>
              </h2>
            </div>
            <div className="grid gap-6">
              <DebtSectionSkeleton />
              <ChequesSkeletonSection />
              <HistorialChartSkeleton />
            </div>
          </>
        }
      >
        <DebtorData id={id} />
      </Suspense>
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
