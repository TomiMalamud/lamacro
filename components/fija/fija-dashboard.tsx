"use client";

import { SecurityData } from "@/types/fija";
import { useFijaData } from "@/hooks/use-fija-data";
import FijaTable from "./fija-table";
import FijaChart from "./fija-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FijaDashboardProps {
  letras: SecurityData[];
  bonos: SecurityData[];
}

export default function FijaDashboard({ letras, bonos }: FijaDashboardProps) {
  const { tableData } = useFijaData({ letras, bonos });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>LECAPs, BONCAPs y Duales</CardTitle>
          <CardDescription>
            Tabla completa de letras y bonos con cálculos de TNA, TEM y TEA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FijaTable letras={letras} bonos={bonos} />
        </CardContent>
      </Card>

      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle>TEM vs Días hasta Vencimiento</CardTitle>
          <CardDescription>
            Gráfico de dispersión que muestra la relación entre TEM y días hasta
            vencimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FijaChart data={tableData} />
        </CardContent>
      </Card>
      <div className="sm:hidden">
        <FijaChart data={tableData} />
      </div>
    </div>
  );
}
