import { DebtorClientPage } from "@/components/debts/debtor-client-page";
import { Metadata } from "next";

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

  return <DebtorClientPage id={resolvedParams.id} />;
}
