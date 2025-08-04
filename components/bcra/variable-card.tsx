import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BCRAVariable } from "@/lib/bcra-fetch";
import { formatDateAR, formatNumber } from "@/lib/utils";
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
        className={`${className} !gap-3 h-full cursor-pointer hover:shadow-xs white transition-all group animate-fade-in flex flex-col`}
      >
        <CardHeader className="grow-0">
          <span className="text-xs text-muted-foreground">
            Últ. act: {formatDateAR(variable.fecha)}
          </span>
          <CardTitle className="text-sm font-medium line-clamp-2 min-h-10">
            {variable.descripcion.replace("n.a.", "TNA").replace("e.a.", "TEA")}
          </CardTitle>
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
