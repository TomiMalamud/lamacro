"use client";

import AllVariablesSection from "@/components/bcra/all-variables-section";
import { VariableCard } from "@/components/bcra/variable-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BCRAVariable } from "@/lib/bcra-fetch";
import { Clock, Download, Loader, Search } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";

interface BCRADashboardProps {
  initialVariables: BCRAVariable[];
}

// Make this component dynamically rendered each time
export default function BCRADashboard({
  initialVariables,
}: BCRADashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Use initialVariables directly
  const variables = initialVariables;

  // Filter variables by ID for each category based on example.md

  // Inflación section
  const variablesInflacion = variables
    .filter((v) => [27, 28, 29].includes(v.idVariable))
    .sort(
      (a, b) =>
        [27, 28, 29].indexOf(a.idVariable) - [27, 28, 29].indexOf(b.idVariable),
    );

  // Divisas section
  const variablesDivisas = variables
    .filter((v) => [1, 4, 5].includes(v.idVariable))
    .sort(
      (a, b) =>
        [1, 4, 5].indexOf(a.idVariable) - [1, 4, 5].indexOf(b.idVariable),
    );

  // Tasas de Interés section
  const variablesTasas = variables
    .filter((v) =>
      [6, 34, 44, 45, 7, 35, 8, 9, 11, 12, 13, 14, 43].includes(v.idVariable),
    )
    .sort(
      (a, b) =>
        [6, 34, 44, 45, 7, 35, 8, 9, 11, 12, 13, 14, 43].indexOf(a.idVariable) -
        [6, 34, 44, 45, 7, 35, 8, 9, 11, 12, 13, 14, 43].indexOf(b.idVariable),
    );

  // Base Monetaria section
  const variablesBaseMonetaria = variables
    .filter((v) => [15, 16, 17, 18, 19].includes(v.idVariable))
    .sort(
      (a, b) =>
        [15, 16, 17, 18, 19].indexOf(a.idVariable) -
        [15, 16, 17, 18, 19].indexOf(b.idVariable),
    );

  // Depósitos section
  const variablesDepositos = variables
    .filter((v) => [21, 22, 23, 24].includes(v.idVariable))
    .sort(
      (a, b) =>
        [21, 22, 23, 24].indexOf(a.idVariable) -
        [21, 22, 23, 24].indexOf(b.idVariable),
    );

  // Índices section
  const variablesIndices = variables
    .filter((v) => [30, 31, 32, 40].includes(v.idVariable))
    .sort(
      (a, b) =>
        [30, 31, 32, 40].indexOf(a.idVariable) -
        [30, 31, 32, 40].indexOf(b.idVariable),
    );

  // Privados section
  const variablesPrivados = variables
    .filter((v) => [25, 26].includes(v.idVariable))
    .sort(
      (a, b) => [25, 26].indexOf(a.idVariable) - [25, 26].indexOf(b.idVariable),
    );

  // Add exportSectionVariables function
  const exportSectionVariables = () => {
    if (!variables || variables.length === 0) return;

    setExportLoading(true);
    try {
      // Get all section variables
      const sectionVariables = [
        ...variablesInflacion,
        ...variablesDivisas,
        ...variablesTasas,
        ...variablesBaseMonetaria,
        ...variablesDepositos,
        ...variablesIndices,
        ...variablesPrivados,
      ];

      // Create CSV content
      const headers = ["Variable", "Fecha", "Valor"];
      const csvContent = [
        headers.join(","),
        ...sectionVariables.map((variable) => {
          const date = formatDate(variable.fecha, "dd/MM/yyyy");
          const value = formatNumber(variable.valor).replace(",", ".");
          return [variable.descripcion.replace(/,/g, ";"), date, value].join(
            ",",
          );
        }),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `variables_bcra_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-secondary"
            />
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={exportSectionVariables}
            disabled={exportLoading || !variables || variables.length === 0}
            className="whitespace-nowrap  dark:bg-secondary dark:hover:bg-secondary/50"
          >
            {exportLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden md:block">Exportar a CSV</span>
                <span className="block md:hidden">CSV</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {!searchTerm && (
        <>
          {/* Inflación Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Inflación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesInflacion.map((variable) => (
                <VariableCard
                  disableTrend={false}
                  key={variable.idVariable}
                  variable={variable}
                  prefetch={true}
                />
              ))}
            </div>
          </section>

          {/* Divisas Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Divisas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesDivisas.map((variable) => (
                <VariableCard
                  disableTrend={false}
                  key={variable.idVariable}
                  variable={variable}
                  prefetch={true}
                />
              ))}
            </div>
          </section>

          {/* Tasas de Interés Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Tasas de Interés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesTasas.map((variable) => (
                <VariableCard
                  key={variable.idVariable}
                  variable={variable}
                  prefetch={true}
                />
              ))}
            </div>
          </section>

          {/* Base Monetaria Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Base Monetaria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesBaseMonetaria.map((variable) => (
                <VariableCard
                  prefetch={true}
                  key={variable.idVariable}
                  variable={variable}
                />
              ))}
            </div>
          </section>

          {/* Depósitos Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Depósitos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesDepositos.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>

          {/* Índices Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Índices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesIndices.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>

          {/* Privados Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Privados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variablesPrivados.map((variable) => (
                <VariableCard key={variable.idVariable} variable={variable} />
              ))}
            </div>
          </section>
        </>
      )}

      <AllVariablesSection
        variables={variables}
        totalCount={variables.length}
        searchTerm={searchTerm}
      />
    </div>
  );
}
