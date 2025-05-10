"use client";

import {
  getDualBondSimulationData,
  type DualBondSimulationResults,
} from "@/lib/carry-trade";
import { useEffect, useState } from "react";
import { DualesTamarChart } from "./chart";
import { TARGETS_TEM_BAJA, TARGETS_TEM_SUBA } from "./constants";
import { DualesTamarTable } from "./table";

interface EscenarioData {
  title: string;
  data: DualBondSimulationResults | null;
  isLoading: boolean;
  error: string | null;
}

export default function DualesTamarPage() {
  const [escenarioBaja, setEscenarioBaja] = useState<EscenarioData>({
    title: "Simulación de Baja de Tasas",
    data: null,
    isLoading: true,
    error: null,
  });
  const [escenarioSuba, setEscenarioSuba] = useState<EscenarioData>({
    title: "Simulación de Suba de Tasas",
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const dataBaja = await getDualBondSimulationData(TARGETS_TEM_BAJA);
        setEscenarioBaja((prev) => ({
          ...prev,
          data: dataBaja,
          isLoading: false,
        }));
      } catch (e) {
        console.error("Error fetching baja de tasas data:", e);
        setEscenarioBaja((prev) => ({
          ...prev,
          error: (e as Error).message || "Error desconocido",
          isLoading: false,
        }));
      }

      try {
        const dataSuba = await getDualBondSimulationData(TARGETS_TEM_SUBA);
        setEscenarioSuba((prev) => ({
          ...prev,
          data: dataSuba,
          isLoading: false,
        }));
      } catch (e) {
        console.error("Error fetching suba de tasas data:", e);
        setEscenarioSuba((prev) => ({
          ...prev,
          error: (e as Error).message || "Error desconocido",
          isLoading: false,
        }));
      }
    }
    fetchData();
  }, []);

  const renderEscenario = (escenario: EscenarioData, targetsTEM: number[]) => {
    if (escenario.isLoading)
      return <p>Cargando datos para {escenario.title}...</p>;
    if (escenario.error)
      return (
        <p className="text-red-500">
          Error cargando {escenario.title}: {escenario.error}
        </p>
      );
    if (!escenario.data)
      return <p>No hay datos disponibles para {escenario.title}.</p>;

    return (
      <div className="space-y-8 mt-8">
        <h3 className="text-2xl font-semibold tracking-tight">
          {escenario.title}
        </h3>
        <DualesTamarChart
          chartData={escenario.data.chartData}
          scatterPoints={escenario.data.scatterPoints}
          eventDates={escenario.data.eventDates}
          targetsTEM={targetsTEM}
        />
        <DualesTamarTable
          tableData={escenario.data.tableDataTemDiff}
          title="Diferencial TEM (TAMAR - Tasa Fija)"
        />
        <DualesTamarTable
          tableData={escenario.data.tableDataPayoffDiff}
          title="Diferencial Payoff Acumulado"
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground">
      <h2 className="text-3xl font-bold tracking-tight">
        Análisis de Bonos Duales TAMAR
      </h2>
      {renderEscenario(escenarioBaja, TARGETS_TEM_BAJA)}
      {renderEscenario(escenarioSuba, TARGETS_TEM_SUBA)}
    </div>
  );
}
