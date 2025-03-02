import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SearchForm } from "@/components/deudores/search-form";

export const metadata: Metadata = {
  title: "Central de Deudores - Búsqueda",
  description: "Buscar información de deudas registradas en el BCRA por CUIT/CUIL"
};

export default function DebtSearchPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Central de Deudores</h1>
        <p className="text-muted-foreground">
          Consulta información de deudas registradas en el BCRA por CUIT/CUIL
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Buscar por CUIT/CUIL</CardTitle>
            <CardDescription>
              Ingresa el CUIT o CUIL sin guiones para consultar la información de deudas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchForm />
            
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Ejemplos de consulta</h3>
              <div className="grid gap-2">
                <Link 
                  href="/debts/30500001735" 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  CUIT 30-50000173-5 (Banco de la Nación Argentina)
                </Link>
                <Link 
                  href="/debts/30500007601" 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  CUIT 30-50000760-1 (Banco de la Provincia de Buenos Aires)
                </Link>
                <Link 
                  href="/debts/30500010084" 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  CUIT 30-50001008-4 (Banco de la Provincia de Córdoba S.A.)
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Acerca de la Central de Deudores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                La Central de Deudores del BCRA permite obtener un informe consolidado por clave de identificación fiscal (CUIT, CUIL o CDI) para una persona humana o jurídica respecto de financiaciones otorgadas por entidades financieras, fideicomisos financieros, entidades no financieras emisoras de tarjetas de crédito / compra, otros proveedores no financieros de créditos, sociedades de garantía recíproca, fondos de garantía de carácter público y proveedores de servicios de crédito entre particulares a través de plataformas.
              </p>
              <p className="text-sm">
                La información se actualiza mensualmente y contiene datos sobre la situación de la deuda, montos, días de atraso, refinanciaciones y otros detalles relevantes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 