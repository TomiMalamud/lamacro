import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatNumber, formatPeriod } from "@/lib/utils";

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

interface DebtBadgeProps {
  label: string;
  colorClass: string;
}

const DebtBadge = ({ label, colorClass }: DebtBadgeProps) => (
  <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
    {label}
  </span>
);

export default function DebtMobileSection({
  deudaData,
}: {
  deudaData: DeudaResponse | null;
}) {
  if (!deudaData?.results.periodos?.length) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Deudas Actuales</CardTitle>
        <CardDescription>
          <div className="space-y-2">
            <div>
              Período: {formatPeriod(deudaData.results.periodos[0].periodo)}
            </div>
            <div className="flex items-center gap-1">
              Monto expresado en pesos.
            </div>
            <div className="flex items-center gap-1">
              <span className="block">
                Si dice &quot;normal&quot;,{" "}
                <span className="font-bold text-white">¡NO ES MORA!</span> La
                deuda incluye los consumos realizados con tarjeta de crédito. La
                situación &quot;normal&quot;{" "}
                <Popover>
                  <PopoverTrigger className="font-bold text-white">
                    es estar al día.<sup>?</sup>
                  </PopoverTrigger>
                  <PopoverContent className="text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Normal: Atraso en el pago que no supere los 31 días. (o
                        sea, al día)
                      </li>
                      <li>
                        Riesgo bajo: Atraso en el pago de más de 31 y hasta 90
                        días desde el vencimiento.
                      </li>
                      <li>
                        Riesgo medio: Atraso en el pago de más de 90 y hasta 180
                        días.
                      </li>
                      <li>
                        Riesgo alto: Atraso en el pago de más de 180 días hasta
                        un año.
                      </li>
                      <li>Irrecuperable: Atrasos superiores a un año.</li>
                    </ul>
                    <a
                      className="text-blue-500 hover:text-blue-600"
                      href="https://www.bcra.gob.ar/BCRAyVos/Preg-Frec-Qué-significa-cada-situación-en-la-Central-de-deudores-considerando-sólo-la-mora.asp"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Fuente
                    </a>
                  </PopoverContent>
                </Popover>
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {deudaData.results.periodos[0].entidades?.map((entidad, index) => (
            <div
              key={index}
              className={`py-4 ${index === 0 ? "" : "border-t"}`}
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold text-base">
                    {entidad.entidad}
                  </div>
                  <div className="flex items-center gap-2">
                    <DebtBadge
                      label={getSituacionDescription(entidad.situacion)}
                      colorClass={getSituacionColor(entidad.situacion)}
                    />
                    <span className="text-muted-foreground">
                      Días de atraso: {entidad.diasAtrasoPago ?? "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Deuda:{" "}
                      <span className="text-foreground">
                        $ {formatNumber(Number(entidad.monto) * 1000)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {entidad.refinanciaciones && (
                    <DebtBadge
                      label="Refinanciado"
                      colorClass="bg-blue-100 text-blue-800"
                    />
                  )}
                  {entidad.recategorizacionOblig && (
                    <DebtBadge
                      label="Recategorizado"
                      colorClass="bg-orange-100 text-orange-800"
                    />
                  )}
                  {entidad.situacionJuridica && (
                    <DebtBadge
                      label="Situación Jurídica"
                      colorClass="bg-purple-100 text-purple-800"
                    />
                  )}
                  {entidad.irrecDisposicionTecnica && (
                    <DebtBadge
                      label="Irrecuperable DT"
                      colorClass="bg-red-100 text-red-800"
                    />
                  )}
                  {entidad.enRevision && (
                    <DebtBadge
                      label="En Revisión"
                      colorClass="bg-yellow-100 text-yellow-800"
                    />
                  )}
                  {entidad.procesoJud && (
                    <DebtBadge
                      label="Proceso Judicial"
                      colorClass="bg-red-100 text-red-800"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
