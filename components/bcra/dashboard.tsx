// Make this component dynamically rendered each time
export const dynamic = "force-dynamic";

import { VariableCard } from "@/components/bcra/variable-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchBCRADirect } from "@/lib/direct-bcra";
import { AlertCircle, Clock } from "lucide-react";
import {
  TooltipProvider
} from "../ui/tooltip";

// Import the client component from a separate file
import RemainingVariablesSection from "@/components/bcra/remaining-variables-section";

// Mark this component as an async server component
export default async function BCRADashboard() {
  try {
    // Use the direct fetch function instead of going through the API route
    const response = await fetchBCRADirect();

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
          <header className="mb-8 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Actualizado: {new Date().toLocaleDateString("es-AR")}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-primary tracking-tight">
                BCRA en Vivo
              </h1>
              <p className="text-primary mt-2">
                Visualización de variables monetarias del Banco Central de la
                República Argentina. Utilizando la API de BCRA.
              </p>
            </div>
            <ThemeToggle />
          </header>

          {/* Variables Cambiarias Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
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
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Variables Monetarias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monetariaPairs.map((pair, index) => {
                if (pair.length === 2) {
                  // Use the enhanced VariableCard with rate pair support
                  const [tna, tea] = pair;
                  // Make sure both variables are defined before rendering
                  if (tna && tea) {
                    return (
                      <VariableCard
                        key={`pair-${index}`}
                        variable={tna}
                        secondVariable={tea}
                        ratePair={true}
                        className="h-full"
                      />
                    );
                  }
                }

                // Fallback for incomplete pairs
                return (
                  <div
                    key={`fallback-${index}`}
                    className="grid grid-cols-1 gap-4"
                  >
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
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Inflación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesInflacion.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>

          {/* Use the client component for remaining variables */}
          <RemainingVariablesSection
            variables={remainingVariables}
            totalCount={remainingVariables.length}
          />
        </div>
      </TooltipProvider>
    );
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <TooltipProvider>
        <div className="container mx-auto py-8">
          <header className="mb-8 flex justify-between items-start">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">BCRA en Vivo</h1>
              <p className="text-muted-foreground">
                Visualización de variables monetarias del Banco Central de la
                República Argentina
              </p>
            </div>

            {/* Add theme toggle here */}
            <ThemeToggle />
          </header>

          <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg border p-6 my-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="font-medium text-lg">Error al cargar datos</h3>
              <p>
                No se pudieron cargar los datos del BCRA. Es posible que el API
                tenga restricciones de ubicación geográfica o IP.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                {error instanceof Error ? error.message : "Error desconocido"}
              </p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
}
