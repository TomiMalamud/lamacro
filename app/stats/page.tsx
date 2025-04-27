import BCRADashboard from "@/components/bcra/dashboard";
import { fetchBCRADirect } from "@/lib/bcra-fetch";
import { AlertCircle } from "lucide-react";

export const revalidate = 3600;

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
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div className="flex-grow">
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
    <main className="min-h-screen mx-auto px-6 sm:px-16">
      <BCRADashboard initialVariables={data?.results ?? []} />
    </main>
  );
}
