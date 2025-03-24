// Remove force-dynamic and implement proper caching
export const revalidate = 3600; // Revalidate every hour

import { VariableDetailClient } from "@/components/bcra/variable-detail-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/bcra-fetch";
import { fetchBCRADirect, fetchVariableTimeSeries } from "@/lib/bcra-fetch";
import { format, subMonths } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Generate static params for the most commonly accessed variables
export async function generateStaticParams() {
  return [
    { id: '1' },   // Common exchange rate
    { id: '4' },   // Another exchange rate
    { id: '27' },  // Inflation
    { id: '28' },  // Inflation
    { id: '29' },  // Inflation
    { id: '160' }, // Monetary
    { id: '161' }, // Monetary
    { id: '136' }, // Monetary
    { id: '137' }, // Monetary
    { id: '139' }, // Monetary
    { id: '140' }  // Monetary
  ];
}

// Page component for variable details
export default async function VariableDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  // Since params is a Promise, we need to await it
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  // Validate ID
  if (isNaN(id)) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 sm:px-12 px-2">
        <Link href="/" passHref prefetch={true}>
          <Button variant="link" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
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
    <div className="space-y-6">
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
    // Set default date range for initial data (3 months)
    const desde = format(subMonths(new Date(), 3), "yyyy-MM-dd");
    const hasta = format(new Date(), "yyyy-MM-dd");

    // Fetch data in parallel
    const [timeSeriesData, allVariablesData] = await Promise.all([
      fetchVariableTimeSeries(id, desde, hasta),
      fetchBCRADirect()
    ]);

    // Find the variable in the full list to get its description
    const variableInfo = allVariablesData.results.find(
      (v) => v.idVariable === id
    );

    // Get description or use fallback
    const variableDescription = variableInfo?.descripcion || `Variable #${id}`;

    // Get the most recent data point for the header
    const latestDataPoint = timeSeriesData.results[0];

    if (!latestDataPoint) {
      throw new Error("No data available for this variable");
    }

    return (
      <div className="space-y-4 sm:px-16 px-6">
        <h1 className="text-3xl font-bold text-primary">
          {variableDescription.replace('n.a.', 'TNA').replace('e.a.', 'TEA')}
        </h1>
        <p className="text-sm text-muted-foreground">
          Última actualización: {formatDate(latestDataPoint.fecha)}
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
                `Explicá la variable "${variableDescription.replace(/%/g, 'porcentaje')}" del Banco Central de la República Argentina (BCRA). Qué significa que actualmente tenga un valor de ${latestDataPoint.valor}?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="gap-2">
                Preguntar a ChatGPT
                <ArrowLeft className="h-4 w-4 rotate-[135deg]" />
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
              No se pudieron cargar los datos para esta variable. Puede que no exista.
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
