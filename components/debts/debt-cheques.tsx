import { ChequeResponse } from "@/lib/debts";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";

export default function DebtCheques({
  id,
  chequesData,
}: {
  id: string;
  chequesData?: ChequeResponse | null;
}) {
  return (
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
                            {formatDate(cheque.fechaRechazo, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{formatNumber(cheque.monto, 2)}</TableCell>
                          {cheque.fechaPago && (
                            <TableCell>
                              {formatDate(cheque.fechaPago, "dd/MM/yyyy")}
                            </TableCell>
                          )}
                          <TableCell>
                            {cheque.estadoMulta ||
                              (cheque.fechaPagoMulta ? "Pagada" : "Pendiente")}
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
          Estas consultas se realizan sobre la Central de cheques rechazados,
          conformada por datos recibidos diariamente de los bancos, que se
          publican sin alteraciones de acuerdo con los plazos dispuestos en el
          inciso 4 del artículo 26 de la Ley 25.326 de Protección de los Datos
          Personales y con el criterio establecido en el punto 1.3. de la
          Sección 1 del Texto ordenado Centrales de Información. Su difusión no
          implica conformidad por parte de este Banco Central.
        </CardFooter>
      </CardContent>
    </Card>
  );
}
export function ChequesSkeletonSection() {
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
