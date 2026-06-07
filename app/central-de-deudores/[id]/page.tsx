import {
  DebtorAdditionalInfo,
  DebtorChequesSection,
  DebtorCurrentDebtSection,
  DebtorDenomination,
  DebtorHistorialSection,
} from "@/components/debts/debtor-result";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id: string = resolvedParams.id;

  return {
    title: `Deudas CUIT/CUIL ${id}`,
    description: `Información de deudas registradas en el BCRA para el CUIT/CUIL ${id}`,
    other: {
      "format-detection": "telephone=no",
    },
  };
}

export default async function DebtorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return (
    <main className="min-h-screen mx-auto p-6 sm:px-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/central-de-deudores"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ChevronLeft className="mr-1" size={16} />
            Volver a búsqueda
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Central de Deudores</h1>
        <h2 className="text-xl text-slate-700 dark:text-slate-300">
          CUIT: {formatCuit(id)}
          <Suspense fallback={null}>
            <DebtorDenomination id={id} />
          </Suspense>
        </h2>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<DebtorCurrentDebtSkeleton />}>
          <DebtorCurrentDebtSection id={id} />
        </Suspense>

        <Suspense fallback={<DebtorSecondarySectionSkeleton />}>
          <DebtorChequesSection id={id} />
        </Suspense>

        <Suspense fallback={<DebtorSecondarySectionSkeleton />}>
          <DebtorHistorialSection id={id} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <DebtorAdditionalInfo id={id} />
      </Suspense>
    </main>
  );
}

function DebtorCurrentDebtSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

function DebtorSecondarySectionSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}

function formatCuit(id: string): string {
  return `${id.slice(0, 2)}-${id.slice(2, 10)}-${id.slice(10)}`;
}
