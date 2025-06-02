import BCRADashboard from "@/components/bcra/dashboard";
import { fetchBCRADirect } from "@/lib/bcra-fetch";
import { AlertCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Estadísticas BCRA",
  description:
    "Variables económicas, monetarias y cambiarias del Banco Central de la República Argentina.",
};

export default async function Stats() {
  let data;
  let error = null;

  try {
    data = await fetchBCRADirect();
    if (!data?.results || !Array.isArray(data.results)) {
      throw new Error("Formato de datos inesperado recibido del BCRA.");
    }
  } catch (err) {
    console.error("Error fetching BCRA data in page:", err);
    error =
      err instanceof Error ? err.message : "Error desconocido al cargar datos.";
  }

  if (error) {
    return (
      <main className="min-h-screen mx-auto px-6 sm:px-16 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg border p-6 my-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="grow">
            <h3 className="font-medium text-lg">Error al cargar datos</h3>
            <p>No se pudieron cargar los datos iniciales del BCRA.</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Handle case where data is fetched but results array is empty
  if (data && data.results.length === 0) {
    return (
      <main className="min-h-screen mx-auto px-6 sm:px-16 py-8">
        <p className="text-muted-foreground text-center">
          No se encontraron variables del BCRA.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen mx-auto px-6 sm:px-16 py-8">
      <div className="container mx-auto">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={12} />
            Se actualiza una vez por día
          </div>
          <h1 className="text-3xl font-bold">{metadata.title}</h1>
          <p className="text-muted-foreground">{metadata.description}</p>
        </div>
      </div>
      <BCRADashboard initialVariables={data?.results ?? []} />
    </main>
  );
}

export const revalidate = 3600;
export const dynamic = "force-static";
