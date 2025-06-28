"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getDualBondSimulationData,
  type DualBondSimulationResults,
} from "@/lib/duales";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DualesTamarChart } from "./duales-chart";
import { DualesTamarTable } from "./duales-table";

interface SimulacionData {
  data: DualBondSimulationResults | null;
  isLoading: boolean;
  error: string | null;
}

interface DualesClientProps {
  initialData: DualBondSimulationResults | null;
  initialTamarTEM: number;
}

const MIN_TAMAR_TEM = 0.005;
const MAX_TAMAR_TEM = 0.055;
const TAMAR_TEM_STEP = 0.005;

// Generate TEM options for the radio group
const TEM_OPTIONS = Array.from(
  {
    length: Math.round((MAX_TAMAR_TEM - MIN_TAMAR_TEM) / TAMAR_TEM_STEP) + 1,
  },
  (_, i) => MIN_TAMAR_TEM + i * TAMAR_TEM_STEP,
);

export default function DualesClient({
  initialData,
  initialTamarTEM,
}: DualesClientProps) {
  const [currentTamarTEM, setCurrentTamarTEM] =
    useState<number>(initialTamarTEM);

  const [simulacion, setSimulacion] = useState<SimulacionData>({
    data: initialData,
    isLoading: false,
    error: initialData ? null : "No initial data available",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!isMounted) return;

      // Only show loading if we don't have initial data or if TEM changed
      if (!initialData || currentTamarTEM !== initialTamarTEM) {
        setSimulacion((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
      }

      try {
        const result = await getDualBondSimulationData();

        if (!isMounted) return;

        if (result) {
          if (isMounted) {
            setSimulacion({
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
  }, [currentTamarTEM, initialTamarTEM, initialData]);

  const handleTEMChange = (value: string) => {
    setCurrentTamarTEM(parseFloat(value));
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
          <DualesTamarChart
            chartData={simulacion.data.chartData}
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
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Ajustar TEM Proyectada a Diciembre 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentTamarTEM.toString()}
            onValueChange={handleTEMChange}
            className="flex flex-wrap gap-2"
          >
            {TEM_OPTIONS.map((temValue) => {
              const temId = `tem-${(temValue * 100).toFixed(1).replace(".", "-")}`;
              const isSelected = currentTamarTEM === temValue;
              return (
                <div key={temId}>
                  <RadioGroupItem
                    value={temValue.toString()}
                    id={temId}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={temId}
                    className={`font-light flex items-center justify-center transition-all duration-200 cursor-pointer text-sm py-2 px-3 rounded-2xl w-20 border-input border-[1px] ${
                      isSelected
                        ? "bg-primary border-none pointer-events-none text-primary-foreground"
                        : "bg-secondary hover:border-primary/80 text-secondary-foreground"
                    }`}
                  >
                    {(temValue * 100).toFixed(1)}%
                    {isSelected && <Check className="ml-2" size={16} />}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>
      {renderSimulacion()}
    </>
  );
}
