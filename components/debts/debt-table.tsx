import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";


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

export default function DebtSection({ deudaData }: { deudaData: DeudaResponse | null }) {
    if (!deudaData?.results.periodos?.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deudas Actuales</CardTitle>
                <CardDescription>
                    Período: {formatPeriod(deudaData.results.periodos[0].periodo)}. Monto
                    expresado en{" "}
                    <Popover>
                        <PopoverTrigger>
                            <span className="font-bold">
                                miles de pesos<sup>?</sup>
                            </span>
                        </PopoverTrigger>
                        <PopoverContent className="text-sm">
                            Por ejemplo: si dice 100 son $100.000 ARS
                        </PopoverContent>
                    </Popover>
                    .
                    <span className="block">
                        La deuda incluye los consumos realizados con tarjeta de crédito. La
                        situación &quot;normal&quot; {" "}
                        <Popover>
                            <PopoverTrigger className="font-bold">
                                es estar al día.<sup>?</sup>
                            </PopoverTrigger>
                            <PopoverContent className="text-sm">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Normal: Atraso en el pago que no supere los 31 días. (o sea, al día)</li>
                                    <li>Riesgo bajo: Atraso en el pago de más de 31 y hasta 90 días desde el vencimiento.</li>
                                    <li>Riesgo medio: Atraso en el pago de más de 90 y hasta 180 días.</li>
                                    <li>Riesgo alto: Atraso en el pago de más de 180 días hasta un año.</li>
                                    <li>Irrecuperable: Atrasos superiores a un año.</li>
                                </ul>
                                <a className="text-blue-500 hover:text-blue-600" href="https://www.bcra.gob.ar/BCRAyVos/Preg-Frec-Qué-significa-cada-situación-en-la-Central-de-deudores-considerando-sólo-la-mora.asp" target="_blank" rel="noopener noreferrer">Fuente</a>
                            </PopoverContent>
                        </Popover>
                    </span>
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
                        {deudaData.results.periodos[0].entidades
                            ?.slice() // Create a copy to avoid mutating original array
                            .sort((a, b) => {
                                // Handle null values
                                if (a.monto === null) return 1;
                                if (b.monto === null) return -1;
                                return b.monto - a.monto;
                            })
                            .map((entidad, entIndex) => (
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
                            ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
