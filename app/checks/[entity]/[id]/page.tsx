import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Metadata for the page
export async function generateMetadata({
  params
}: {
  params: Promise<{ entity: string; id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Cheques - Entidad ${resolvedParams.entity} - ID ${resolvedParams.id}`,
    description: `Información de cheques rechazados para la entidad ${resolvedParams.entity} y el ID ${resolvedParams.id}`
  };
}

// Fetch cheque data
async function fetchChequeData(entity: string, id: string) {
  try {
    // This is a placeholder - replace with actual API call
    // const response = await fetch(`/api/bcra/deudores/cheques/${id}`);
    // if (!response.ok) return null;
    // return await response.json();
    return { entity, id }; // Placeholder return
  } catch (error) {
    console.error("Error fetching cheque data:", error);
    return null;
  }
}

// Main page component
export default async function ChecksPage({ 
  params 
}: { 
  params: Promise<{ entity: string; id: string }> 
}) {
  const resolvedParams = await params;
  const { entity, id } = resolvedParams;
  
  // Fetch data - replace with actual data fetching
  const chequeData = await fetchChequeData(entity, id);
  
  if (!chequeData) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cheques Rechazados</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Entidad: {entity}</p>
          <p>ID: {id}</p>
          <p>Esta página está en desarrollo</p>
        </CardContent>
      </Card>
    </div>
  );
}
