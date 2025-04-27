"use server";

import { fetchVariableTimeSeries } from "./bcra-fetch";

/**
 * Server Action to fetch time series data for a specific variable and date range.
 * Handles errors internally.
 */
export async function getVariableDataForRange(
  variableId: number,
  desde: string,
  hasta: string,
) {
  try {
    const response = await fetchVariableTimeSeries(variableId, desde, hasta);
    if (!response || !response.results) {
      // Even if the API returns 200, results might be missing
      console.error(
        `No results found for variable ${variableId} between ${desde} and ${hasta}`,
      );
      return {
        error: "No se encontraron resultados para el rango seleccionado.",
        data: null,
      };
    }
    return { data: response.results, error: null };
  } catch (error) {
    console.error(
      `Server Action error fetching time series for variable ${variableId}:`,
      error,
    );
    // Avoid leaking sensitive error details to the client
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido en el servidor.";
    // You might want to log the full error server-side here
    return { error: `Error al obtener datos: ${message}`, data: null };
  }
}
