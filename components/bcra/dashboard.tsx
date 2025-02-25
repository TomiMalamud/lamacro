// Add the dynamic export to ensure this is rendered dynamically
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { VariableCard } from "@/components/bcra/variable-card";
import { fetchBCRAData, formatDate, formatNumber } from "@/lib/bcra-api";
import { AlertCircle, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";

async function BCRADashboard() {
  try {
    const response = await fetchBCRAData();
    
    // Make sure we have valid data
    if (!response || !response.results || !Array.isArray(response.results)) {
      throw new Error("Invalid data received from API: results array missing");
    }
    
    const variables = response.results;
    
    // Check if we have any variables
    if (variables.length === 0) {
      throw new Error("API returned empty data set");
    }

    // Filter variables by ID for each category
    const variablesCambiarias = variables.filter((v) =>
      [1, 4].includes(v.idVariable)
    );

    // Group monetary variables into pairs
    const monetariaPairs = [
      [160, 161],
      [136, 137],
      [139, 140]
    ].map((pair) => {
      return pair
        .map((id) => variables.find((v) => v.idVariable === id))
        .filter(Boolean);
    });

    const variablesInflacion = variables.filter((v) =>
      [27, 28, 29].includes(v.idVariable)
    );

    // All variables that are not in the specific categories
    const usedVariableIds = [1, 4, 160, 161, 136, 137, 139, 140, 27, 28, 29];
    const remainingVariables = variables.filter(
      (v) => !usedVariableIds.includes(v.idVariable)
    );

    return (
      <TooltipProvider>
        <div className="container mx-auto py-8">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Actualizado: {new Date().toLocaleDateString("es-AR")}
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight">BCRA en Vivo</h1>
            <p className="text-[#232D4F] mt-2">
              Visualización de variables monetarias del Banco Central de la
              República Argentina. Utilizando la API de BCRA.
            </p>
          </header>

          {/* Variables Cambiarias Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              Variables Cambiarias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {variablesCambiarias.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>

          {/* Variables Monetarias Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              Variables Monetarias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monetariaPairs.map((pair, index) => {
                if (pair.length === 2) {
                  // Extract the TNA and TEA variables
                  const [tna, tea] = pair;

                  return (
                    <Card key={index} className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {tna?.descripcion
                            .split("(")[0]
                            .trim()
                            .replace(/, TNA/g, "")
                            .replace(/,TNA/g, "")}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(tna?.fecha || "")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-x-8 flex items-center">
                          <div>
                            <div className="text-sm font-medium">
                              TNA
                              <Tooltip>
                                <TooltipTrigger className="ml-1 cursor-help text-muted-foreground">
                                  (?)
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tasa Nominal Anual</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-2xl font-bold">
                              {formatNumber(tna?.valor || 0, 2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              TEA
                              <Tooltip>
                                <TooltipTrigger className="ml-1 cursor-help text-muted-foreground">
                                  (?)
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tasa Efectiva Anual</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-2xl font-bold">
                              {formatNumber(tea?.valor || 0, 2)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Fallback for incomplete pairs
                return (
                  <div key={index} className="grid grid-cols-1 gap-4">
                    {pair.map(
                      (variable) =>
                        variable && (
                          <VariableCard
                            key={variable.idVariable}
                            variable={variable}
                          />
                        )
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Inflación Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Inflación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesInflacion.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>

          {/* All Remaining Variables Section */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">
              Todas las Variables ({remainingVariables.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {remainingVariables.map((variable) => (
                <VariableCard
                  key={variable.idVariable}
                  variable={variable}
                  className="h-full"
                />
              ))}
            </div>
          </section>
        </div>
      </TooltipProvider>
    );
  } catch (error) {
    // Simplified error UI without refresh button
    return (
      <TooltipProvider>
        <div className="container mx-auto py-8">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">BCRA en Vivo</h1>
            <p className="text-muted-foreground">
              Visualización de variables monetarias del Banco Central de la
              República Argentina
            </p>
          </header>

          <div className="bg-red-50 border-red-200 text-red-700 rounded-lg border p-6 my-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="font-medium text-lg">Error al cargar datos</h3>
              <p>
                No se pudieron cargar los datos del BCRA. Es posible que el API tenga restricciones de ubicación geográfica o IP.
              </p>
              <p className="text-xs text-red-500 mt-2">
                {error instanceof Error ? error.message : "Error desconocido"}
              </p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
}

export default BCRADashboard;