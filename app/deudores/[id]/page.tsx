import { ClipboardLink } from "@/components/debts/copy-link";
import { HistorialChart } from "@/components/debts/debt-chart";
import DebtCheques from "@/components/debts/debt-cheques";
import DebtMobile from "@/components/debts/debt-mobile";
import DebtSection from "@/components/debts/debt-table";
import { SearchForm } from "@/components/debts/search-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchCheques, fetchDeudas, fetchHistorial } from "@/lib/debts";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

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

export default async function DebtorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id: string = resolvedParams.id;

  const [deudaData, historialData, chequesData] = await Promise.all([
    fetchDeudas(id),
    fetchHistorial(id),
    fetchCheques(id),
  ]);

  const hasData = deudaData || historialData || chequesData;

  return (
    <main className="min-h-screen mx-auto p-6 sm:px-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/deudores"
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

          <DebtCheques id={id} chequesData={chequesData} />

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
    </main>
  );
}

export const dynamic = "force-static";
export const revalidate = 86400;
