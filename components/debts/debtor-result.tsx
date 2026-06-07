import { ClipboardLink } from "@/components/debts/copy-link";
import { HistorialChart } from "@/components/debts/debt-chart";
import DebtCheques from "@/components/debts/debt-cheques";
import DebtMobile from "@/components/debts/debt-mobile";
import DebtSection from "@/components/debts/debt-table";
import { SearchForm } from "@/components/debts/search-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDebtorCheques,
  getDebtorDeudas,
  getDebtorHistorial,
} from "@/lib/debtor-lookup";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export async function DebtorDenomination({ id }: { id: string }) {
  const deudaResult = await getDebtorDeudas(id);
  let denominacion = deudaResult.data?.results?.denominacion;

  if (!denominacion) {
    const [historialResult, chequesResult] = await Promise.all([
      getDebtorHistorial(id),
      getDebtorCheques(id),
    ]);

    denominacion =
      historialResult.data?.results?.denominacion ||
      chequesResult.data?.results?.denominacion;
  }

  if (!denominacion) return null;

  return (
    <>
      <span className="hidden md:inline">
        {" - "}
        <span className="animate-fade-in">{denominacion}</span>
      </span>
      <span className="md:hidden">
        <br />
        {denominacion}
      </span>
    </>
  );
}

export async function DebtorCurrentDebtSection({ id }: { id: string }) {
  const deudaResult = await getDebtorDeudas(id);

  if (deudaResult.unavailable && !deudaResult.data) {
    return (
      <>
        <BCRAUnavailableAlert />
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-amber-600">
              Consulta no disponible
            </CardTitle>
            <CardDescription>
              No se pudo obtener la información desde el BCRA en este momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <SearchForm initialValue={id} />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!deudaResult.data) {
    return (
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
                  La persona o entidad no tiene deudas registradas en el sistema
                  financiero
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
    );
  }

  return (
    <>
      {deudaResult.unavailable && <BCRAUnavailableAlert />}
      <div className="hidden md:block">
        <DebtSection deudaData={deudaResult.data} />
      </div>
      <div className="block md:hidden">
        <DebtMobile deudaData={deudaResult.data} />
      </div>
    </>
  );
}

export async function DebtorChequesSection({ id }: { id: string }) {
  const chequesResult = await getDebtorCheques(id);

  if (chequesResult.unavailable) {
    return (
      <Alert className="mb-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Cheques rechazados no disponible</AlertTitle>
        <AlertDescription>
          No se pudo consultar la central de cheques rechazados en este momento.
        </AlertDescription>
      </Alert>
    );
  }

  return <DebtCheques id={id} chequesData={chequesResult.data} />;
}

export async function DebtorHistorialSection({ id }: { id: string }) {
  const historialResult = await getDebtorHistorial(id);

  if (historialResult.unavailable && !historialResult.data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Historial no disponible</AlertTitle>
        <AlertDescription>
          No se pudo consultar el historial de deuda en este momento.
        </AlertDescription>
      </Alert>
    );
  }

  if (!historialResult.data?.results.periodos?.length) return null;

  return <HistorialChart periodos={historialResult.data.results.periodos} />;
}

export async function DebtorAdditionalInfo({ id }: { id: string }) {
  const [deudaResult, historialResult, chequesResult] = await Promise.all([
    getDebtorDeudas(id),
    getDebtorHistorial(id),
    getDebtorCheques(id),
  ]);

  const hasData =
    deudaResult.data || historialResult.data || chequesResult.data;

  if (!hasData) return null;

  return (
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
              INAES. Servicios de Crédito Cooperativo y/o Ayuda Económica Mutual
            </ClipboardLink>
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
        padrón de la Agencia de Recaudación y Control Aduanero (ARCA) o bien la
        que fuera registrada por la entidad informante.
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
          <strong>Situación 1:</strong> En situación normal | Cartera comercial
          y Cartera para consumo o vivienda
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
          <strong>Situación 4:</strong> Con alto riesgo de insolvencia | Cartera
          comercial y Riesgo alto | Cartera para consumo o vivienda
        </li>
        <li>
          <strong>Situación 5:</strong> Irrecuperable | Cartera comercial y
          Cartera para consumo o vivienda
        </li>
      </ul>

      <h3 className="font-semibold mt-4">5. Monto</h3>
      <p>Información en pesos.</p>

      <h3 className="font-semibold mt-4">6. Días atraso y 7. Observaciones</h3>
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
        . Para deudores de cartera de consumo o vivienda en situación distinta a
        la normal, se informan los días de atraso en casos de refinanciaciones,
        recategorización obligatoria o situación jurídica. La leyenda (N/A)
        indica &quot;No Aplicable&quot;.
      </p>

      <h3 className="font-semibold mt-4">8. Protección de Datos Personales</h3>
      <p>
        Los deudores se identifican según la Ley 25.326 de Protección de los
        Datos Personales:
      </p>
      <ul className="list-disc pl-6 mt-2">
        <li>Información sometida a revisión (artículo 16, inciso 6)</li>
        <li>Información sometida a proceso judicial (artículo 38, inciso 3)</li>
      </ul>
    </div>
  );
}

function BCRAUnavailableAlert() {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>El BCRA no respondió la consulta</AlertTitle>
      <AlertDescription>
        No se pudo obtener la información principal desde el BCRA. Probá de
        nuevo en unos minutos.
      </AlertDescription>
    </Alert>
  );
}
