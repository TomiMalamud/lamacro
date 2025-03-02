import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR').format(date);
}

// Helper function to get situation description
function getSituacionDescription(situacion: number | null): string {
  if (situacion === null) return "No disponible";
  
  switch(situacion) {
    case 1: return "Situación normal";
    case 2: return "Riesgo bajo";
    case 3: return "Riesgo medio";
    case 4: return "Riesgo alto";
    case 5: return "Irrecuperable";
    case 6: return "Irrecuperable por disposición técnica";
    default: return `Situación ${situacion}`;
  }
}

// Helper function to get situation color
function getSituacionColor(situacion: number | null): string {
  if (situacion === null) return "bg-gray-200";
  
  switch(situacion) {
    case 1: return "bg-green-100 text-green-800";
    case 2: return "bg-yellow-100 text-yellow-800";
    case 3: return "bg-orange-100 text-orange-800";
    case 4: return "bg-red-100 text-red-800";
    case 5: return "bg-red-200 text-red-900";
    case 6: return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100";
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Ensure params.id is properly handled
  const id = params.id;
  return {
    title: `Deudas CUIT/CUIL ${id}`,
    description: `Información de deudas registradas en el BCRA para el CUIT/CUIL ${id}`
  };
}

async function fetchDeudas(id: string): Promise<DeudaResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      url = `${baseUrl}/api/bcra/deudores/${id}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching debt data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching debt data:', error);
    return null;
  }
}

async function fetchHistorial(id: string): Promise<HistorialResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/historicas/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      url = `${baseUrl}/api/bcra/deudores/historicas/${id}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching historical data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

async function fetchCheques(id: string): Promise<ChequeResponse | null> {
  try {
    // Create a URL that works in both server and client environments
    let url: string;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Client-side: Use relative URL which will be resolved against the current origin
      url = `/api/bcra/deudores/cheques/${id}`;
    } else {
      // Server-side: Use absolute URL with environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      url = `${baseUrl}/api/bcra/deudores/cheques/${id}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching check data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching check data:', error);
    return null;
  }
}

export default async function DebtPage({ params }: { params: { id: string } }) {
  // Ensure params.id is properly handled
  const id = params.id;
  const deudaData = await fetchDeudas(id);
  const historialData = await fetchHistorial(id);
  const chequesData = await fetchCheques(id);
  
  // If no data is found, show 404
  if (!deudaData && !historialData && !chequesData) {
    notFound();
  }
  
  const denominacion = deudaData?.results?.denominacion || 
                       historialData?.results?.denominacion || 
                       chequesData?.results?.denominacion || 
                       "No disponible";
  
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href="/debts/search" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver a búsqueda
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Central de Deudores</h1>
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <div className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-md font-mono">
            {id}
          </div>
          <h2 className="text-xl">{denominacion}</h2>
        </div>
      </div>
      
      <Tabs defaultValue="deudas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="deudas">Deudas Actuales</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="cheques">Cheques Rechazados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deudas">
          {deudaData ? (
            <div className="space-y-6">
              {deudaData.results.periodos?.map((periodo, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>Período: {periodo.periodo}</CardTitle>
                    <CardDescription>
                      Información de deudas registradas en el período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Situación</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Días Atraso</TableHead>
                          <TableHead>Detalles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periodo.entidades?.map((entidad, entIndex) => (
                          <TableRow key={entIndex}>
                            <TableCell>{entidad.entidad}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getSituacionColor(entidad.situacion)}`}>
                                {getSituacionDescription(entidad.situacion)}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(entidad.fechaSit1)}</TableCell>
                            <TableCell>{formatCurrency(entidad.monto)}</TableCell>
                            <TableCell>{entidad.diasAtrasoPago ?? 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {entidad.refinanciaciones && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Refinanciado</span>
                                )}
                                {entidad.recategorizacionOblig && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Recategorizado</span>
                                )}
                                {entidad.situacionJuridica && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Situación Jurídica</span>
                                )}
                                {entidad.irrecDisposicionTecnica && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Irrecuperable DT</span>
                                )}
                                {entidad.enRevision && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">En Revisión</span>
                                )}
                                {entidad.procesoJud && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Proceso Judicial</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sin datos de deudas</CardTitle>
                <CardDescription>
                  No se encontraron registros de deudas para esta identificación
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="historial">
          {historialData ? (
            <div className="space-y-6">
              {historialData.results.periodos?.map((periodo, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>Período: {periodo.periodo}</CardTitle>
                    <CardDescription>
                      Historial de deudas registradas en el período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Situación</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Detalles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periodo.entidades?.map((entidad, entIndex) => (
                          <TableRow key={entIndex}>
                            <TableCell>{entidad.entidad}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${getSituacionColor(entidad.situacion)}`}>
                                {getSituacionDescription(entidad.situacion)}
                              </span>
                            </TableCell>
                            <TableCell>{formatCurrency(entidad.monto)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {entidad.enRevision && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">En Revisión</span>
                                )}
                                {entidad.procesoJud && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Proceso Judicial</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sin datos históricos</CardTitle>
                <CardDescription>
                  No se encontraron registros históricos para esta identificación
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="cheques">
          {chequesData ? (
            <div className="space-y-6">
              {chequesData.results.causales?.map((causal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>Causal: {causal.causal}</CardTitle>
                    <CardDescription>
                      Cheques rechazados por esta causal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {causal.entidades?.map((entidad, entIndex) => (
                      <div key={entIndex} className="mb-6">
                        <h4 className="text-lg font-medium mb-2">Entidad: {entidad.entidad}</h4>
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
                                <TableCell>{formatDate(cheque.fechaRechazo)}</TableCell>
                                <TableCell>{formatCurrency(cheque.monto)}</TableCell>
                                <TableCell>{formatDate(cheque.fechaPago)}</TableCell>
                                <TableCell>
                                  {cheque.estadoMulta || (cheque.fechaPagoMulta ? 'Pagada' : 'Pendiente')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {cheque.ctaPersonal && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Cuenta Personal</span>
                                    )}
                                    {cheque.denomJuridica && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs" title={cheque.denomJuridica}>
                                        Jurídica
                                      </span>
                                    )}
                                    {cheque.enRevision && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">En Revisión</span>
                                    )}
                                    {cheque.procesoJud && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Proceso Judicial</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sin datos de cheques rechazados</CardTitle>
                <CardDescription>
                  No se encontraron registros de cheques rechazados para esta identificación
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
