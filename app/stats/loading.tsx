import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Download, Search } from "lucide-react";

export default function StatsLoading() {
  return (
    <main className="min-h-screen mx-auto px-6 sm:px-16">
      <div className="container mx-auto py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Actualizado: {new Date().toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-primary tracking-tight">
                  La Macro
                </h1>
                <p className="text-primary ">
                  Visualización de variables económicas, monetarias y cambiarias
                  del Banco Central de la República Argentina.
                </p>
                <p className="text-muted-foreground">
                  La tendencia de las variables se calcula con los últimos 30-60
                  días según la variable.
                </p>
                <p className="text-muted-foreground">
                  Tocá en una variable para ver detalles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar variables..."
                className="pl-10 bg-white dark:bg-secondary"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              className="whitespace-nowrap  dark:bg-secondary dark:hover:bg-secondary/50"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden md:block">Exportar a CSV</span>
              <span className="block md:hidden">CSV</span>
            </Button>
          </div>
        </header>
      </div>
    </main>
  );
}
