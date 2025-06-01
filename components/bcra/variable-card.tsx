import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BCRAVariable } from "@/lib/bcra-fetch";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import Link from "next/link";

interface VariableCardProps {
  variable: BCRAVariable;
  className?: string;
  prefetch?: boolean;
}

export function VariableCard({
  variable,
  className = "",
  prefetch = false,
}: VariableCardProps) {
  return (
    <Link
      href={`/variables/${variable.idVariable}`}
      prefetch={prefetch}
      className="block w-full h-full"
    >
      <Card
        className={`${className} h-full cursor-pointer hover:shadow-xs dark:hover:shadow-neutral-700 white transition-all group animate-fade-in flex flex-col`}
      >
        <CardHeader className="pb-2 grow-0">
          <CardTitle className="text-sm font-medium line-clamp-2 min-h-10">
            {variable.descripcion.replace("n.a.", "TNA").replace("e.a.", "TEA")}
          </CardTitle>
          <CardDescription>
            Últ. act: {formatDate(variable.fecha, "dd/MM/yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grow flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <div className="mr-4">
              <div className="text-3xl font-bold">
                {formatNumber(variable.valor, 2) +
                  (variable.descripcion.includes("%") ||
                  variable.descripcion.includes("Tasa")
                    ? "%"
                    : "")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
