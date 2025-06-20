"use client";

import AllVariablesSection from "@/components/bcra/all-variables-section";
import { VariableCard } from "@/components/bcra/variable-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BCRAVariable } from "@/lib/bcra-fetch";
import { formatDateAR } from "@/lib/utils";
import { Download, Loader, Search } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

interface BCRADashboardProps {
  initialVariables: BCRAVariable[];
}

export default function BCRADashboard({
  initialVariables,
}: BCRADashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const variables = initialVariables;
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

      // Create Excel workbook data
      const worksheetData = [
        ["Variable", "Fecha", "Valor"],
        ...sectionVariables.map((variable) => [
          variable.descripcion,
          formatDateAR(variable.fecha),
          variable.valor,
        ]),
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Variables BCRA");

      // Export file
      XLSX.writeFile(
        workbook,
        `variables_bcra_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex gap-2 max-w-2xl mb-8">
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
              <span className="hidden md:block">Exportar a Excel</span>
              <span className="block md:hidden">Excel</span>
            </>
          )}
        </Button>
      </div>

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
