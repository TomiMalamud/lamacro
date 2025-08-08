import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SecurityData,
  ComparatasasOption,
  FundData,
  FijaTableRow,
} from "@/types/fija";
import FijaCalculator from "./fija-calculator";
import FijaChart from "./fija-chart";
import FijaTable from "./fija-table";

interface FijaDashboardProps {
  letras: SecurityData[];
  bonos: SecurityData[];
  billeteras: ComparatasasOption[];
  fondos: FundData[];
  tableData: FijaTableRow[];
}

export default function FijaDashboard({
  letras,
  bonos,
  billeteras,
  fondos,
  tableData,
}: FijaDashboardProps) {
  return (
    <div className="space-y-8">
      <FijaCalculator
        tableData={tableData}
        billeteras={billeteras}
        fondos={fondos}
      />
      <Card>
        <CardHeader>
          <CardTitle>LECAPs, BONCAPs y Duales</CardTitle>
          <CardDescription>
            Tabla completa de letras y bonos con cálculos de TNA, TEM y TEA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FijaTable tableData={tableData} />
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
