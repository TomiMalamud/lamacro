import { SearchForm } from "@/components/deudores/search-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Deudores - Búsqueda",
  description:
    "Buscar información de deudas registradas en el BCRA por CUIT/CUIL"
};

export default function DebtSearchPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Central de Deudores</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Buscar por CUIT/CUIL</CardTitle>
            <CardDescription>
              Ingresá el CUIT o CUIL sin guiones para consultar la información
              de deudas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm />
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Acerca de la Central de Deudores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                La Central de Deudores del BCRA permite obtener un informe
                consolidado por clave de identificación fiscal (CUIT, CUIL o
                CDI) para una persona humana o jurídica respecto de
                financiaciones otorgadas por entidades financieras, fideicomisos
                financieros, entidades no financieras emisoras de tarjetas de
                crédito / compra, otros proveedores no financieros de créditos,
                sociedades de garantía recíproca, fondos de garantía de carácter
                público y proveedores de servicios de crédito entre particulares
                a través de plataformas.
              </p>
              <p className="text-sm my-2">
                La información se actualiza mensualmente y contiene datos sobre
                la situación de la deuda, montos, días de atraso,
                refinanciaciones y otros detalles relevantes.
              </p>
              <a
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.bcra.gob.ar/BCRAyVos/Preguntas_frecuentes.asp#Central-de-deudores"
              >
                Preguntas Frecuentes sobre la Central de Deudores
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
