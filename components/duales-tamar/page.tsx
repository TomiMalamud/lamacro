"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  getDualBondSimulationData,
  type DualBondSimulationResults,
} from "@/lib/duales";
import { useEffect, useState } from "react";
import { DualesTamarChart } from "./chart";
import { DualesTamarTable } from "./table";

interface SimulacionData {
  title: string;
  data: DualBondSimulationResults | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_TAMAR_TEM = 0.02;
const MIN_TAMAR_TEM = 0.005;
const MAX_TAMAR_TEM = 0.055;
const TAMAR_TEM_STEP = 0.005;

export default function DualesTamarPage() {
  const [currentTamarTEM, setCurrentTamarTEM] =
    useState<number>(INITIAL_TAMAR_TEM);

  const [simulacion, setSimulacion] = useState<SimulacionData>({
    title: "Simulación Dinámica TAMAR",
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isMounted) return;

      setSimulacion((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await getDualBondSimulationData([currentTamarTEM]);

        if (!isMounted) return;

        if (result) {
          if (isMounted) {
            setSimulacion({
              title: "Simulación Dinámica TAMAR",
              data: result,
              isLoading: false,
              error: null,
            });
          }
        } else {
          if (isMounted) {
            setSimulacion((prev) => ({
              ...prev,
              data: null,
              isLoading: false,
              error: "No data returned from simulation.",
            }));
          }
        }
      } catch (e) {
        if (isMounted) {
          console.error("Error fetching TAMAR simulation data:", e);
          setSimulacion((prev) => ({
            ...prev,
            isLoading: false,
            error: (e as Error).message || "Error desconocido",
          }));
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentTamarTEM]);

  const handleSliderChange = (value: number[]) => {
    setCurrentTamarTEM(value[0]);
  };

  const renderSimulacion = () => {
    if (simulacion.isLoading && !simulacion.data) {
      return <p>Cargando datos de simulación...</p>;
    }
    if (simulacion.error) {
      return (
        <p className="text-red-500">
          Error cargando datos de simulación: {simulacion.error}
        </p>
      );
    }
    if (!simulacion.data) {
      return <p>No hay datos disponibles para la simulación.</p>;
    }

    return (
      <div className="space-y-8 mt-8">
        <div className="hidden md:block">
          <h3 className="text-2xl font-semibold tracking-tight">
            {simulacion.title} (TEM Proyectada a Diciembre 2026:{" "}
            {(currentTamarTEM * 100).toFixed(1)}%)
          </h3>
          <DualesTamarChart
            chartData={simulacion.data.chartData}
            scatterPoints={simulacion.data.scatterPoints}
            eventDates={simulacion.data.eventDates}
            targetsTEM={[currentTamarTEM]}
          />
        </div>
        {simulacion.data.tableDataTemDiff &&
          simulacion.data.tableDataPayoffDiff && (
            <DualesTamarTable
              tableDataTemDiff={simulacion.data.tableDataTemDiff}
              tableDataPayoffDiff={simulacion.data.tableDataPayoffDiff}
              title="Diferencial TEM y Payoff Acumulado vs Tasa Fija - Diciembre 2026"
            />
          )}
      </div>
    );
  };

  return (
    <>
      <h2 className="mt-8 text-3xl font-bold tracking-tight">
        Análisis de Bonos Duales TAMAR
      </h2>
      <div className="hidden md:block my-8 p-6 border rounded-lg shadow-sm">
        <Label htmlFor="tamar-tem-slider" className="text-lg font-medium">
          Ajustar TEM Proyectada a Diciembre 2026:{" "}
          <span className="font-bold text-primary">
            {(currentTamarTEM * 100).toFixed(1)}%
          </span>
        </Label>
        <Slider
          id="tamar-tem-slider"
          defaultValue={[INITIAL_TAMAR_TEM]}
          min={MIN_TAMAR_TEM}
          max={MAX_TAMAR_TEM}
          step={TAMAR_TEM_STEP}
          onValueChange={handleSliderChange}
          className="mt-4"
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          {Array.from(
            {
              length:
                Math.round((MAX_TAMAR_TEM - MIN_TAMAR_TEM) / TAMAR_TEM_STEP) +
                1,
            },
            (_, i) => (
              <span key={i}>
                {((MIN_TAMAR_TEM + i * TAMAR_TEM_STEP) * 100).toFixed(1)}%
              </span>
            ),
          )}
        </div>
      </div>
      {renderSimulacion()}
    </>
  );
}
