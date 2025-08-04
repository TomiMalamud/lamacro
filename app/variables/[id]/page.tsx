export const revalidate = 3600;

import { VariableDetailClient } from "@/components/bcra/variable-detail-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchBCRADirect, fetchVariableTimeSeries } from "@/lib/bcra-fetch";
import { STATIC_VARIABLE_IDS } from "@/lib/constants";
import { formatDateAR } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Suspense } from "react";

export async function generateStaticParams() {
  return STATIC_VARIABLE_IDS.map((id) => ({ id: id.toString() }));
}

const getVariableData = cache(async (id: number) => {
  const desde = format(subMonths(new Date(), 3), "yyyy-MM-dd");
  const hasta = format(new Date(), "yyyy-MM-dd");

  const [timeSeriesData, allVariablesData] = await Promise.all([
    fetchVariableTimeSeries(id, desde, hasta),
    fetchBCRADirect(),
  ]);

  const variableInfo = allVariablesData.results.find(
    (v) => v.idVariable === id,
  );

  return {
    timeSeriesData,
    variableInfo,
    variableDescription: variableInfo?.descripcion || `Variable #${id}`,
  };
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    return {
      title: "Variable no encontrada",
      description: "La variable solicitada no existe o no es válida.",
    };
  }

  try {
    const { variableDescription, timeSeriesData } = await getVariableData(id);
    const latestDataPoint = timeSeriesData.results[0];

    const cleanDescription = variableDescription
      .replace("n.a.", "TNA")
      .replace("e.a.", "TEA");

    const title = `${cleanDescription}`;
    const description = latestDataPoint
      ? `Valor actual: ${latestDataPoint.valor}. Última actualización: ${formatDateAR(latestDataPoint.fecha)}. Variable del Banco Central de la República Argentina.`
      : `Entrá para ver el valor de ${cleanDescription} en Argentina.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
      },
      twitter: {
        title,
        description,
        card: "summary",
      },
    };
  } catch (error) {
    return {
      title: `Variable BCRA #${id}`,
      description: `Variable #${id} del Banco Central de la República Argentina.`,
    };
  }
}

export default async function VariableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 sm:px-12 px-2">
        <Button variant="link" className="gap-2" asChild>
          <Link href="/variables" prefetch={true}>
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>

      <Suspense fallback={<VariableDetailSkeleton />}>
        <VariableDetail id={id} />
      </Suspense>
    </div>
  );
}

// Skeleton loader for the variable detail
function VariableDetailSkeleton() {
  return (
    <div className="space-y-6 sm:px-16 px-6">
      <div className="h-10 w-2/3 bg-muted rounded animate-pulse"></div>
      <Card>
        <CardHeader>
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-1/4 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
      <div className="aspect-video w-full bg-muted rounded animate-pulse"></div>
    </div>
  );
}

async function VariableDetail({ id }: { id: number }) {
  try {
    // Use memoized function to get data
    const { timeSeriesData, variableInfo, variableDescription } =
      await getVariableData(id);

    // Get the most recent data point for the header
    const latestDataPoint = timeSeriesData.results[0];

    if (!latestDataPoint) {
      throw new Error("No data available for this variable");
    }

    return (
      <div className="space-y-4 sm:px-16 px-6">
        <h1 className="text-3xl font-bold text-primary">
          {variableDescription.replace("n.a.", "TNA").replace("e.a.", "TEA")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Última actualización: {formatDateAR(latestDataPoint.fecha)}
        </p>

        <VariableDetailClient
          initialValue={latestDataPoint.valor}
          variableDescription={variableDescription}
          initialData={timeSeriesData.results}
          variableId={id}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>¿Qué significa esta variable?</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`https://chat.openai.com/?q=${encodeURIComponent(
                `Explicá la variable "${variableDescription.replace(/%/g, "porcentaje")}" del Banco Central de la República Argentina (BCRA). Qué significa que actualmente tenga un valor de ${latestDataPoint.valor}?`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="gap-2">
                Preguntar a ChatGPT
                <ArrowLeft className="h-4 w-4 rotate-135" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6  sm:px-16 px-6">
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Variable #{id}
        </h1>
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">
              Error al cargar datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              No se pudieron cargar los datos para esta variable. Puede que no
              exista.
            </p>
            <p className="text-xs text-red-500 mt-2">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
