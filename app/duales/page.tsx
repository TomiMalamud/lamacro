import CallValueComponent from "@/components/duales-tamar/call-value";
import DualesClient from "@/components/duales-tamar/duales-client";
import type { CallValueRequest } from "@/lib/duales";
import { getDualBondSimulationData } from "@/lib/duales";
import { getTamarCallValueData } from "@/lib/tamar-actions";

export const metadata = {
  title: "Análisis de Bonos Duales TAMAR",
  description:
    "Análisis y simulación de bonos duales TAMAR con diferentes escenarios de TEM.",
};

const INITIAL_TAMAR_TEM = 0.02;

const DEFAULT_CALL_VALUE_REQUEST: CallValueRequest = {
  target_mean: 0.0143,
  target_prob: 0.0244,
  threshold: 0.0271,
  min_val: 0.0049,
};

export default async function CallsPage() {
  const [initialDualesData, callValueData] = await Promise.all([
    getDualBondSimulationData(),
    getTamarCallValueData(DEFAULT_CALL_VALUE_REQUEST),
  ]);

  return (
    <main className="container mx-auto px-6 md:px-16 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Análisis de Bonos Duales TAMAR
      </h1>
      <p className="text-muted-foreground mb-8">
        Cálculos hechos por{" "}
        <a
          href="https://x.com/JohnGalt_is_www/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:decoration-stone-900 hover:text-stone-900 dark:hover:decoration-stone-200 dark:hover:text-stone-200 transition-all duration-300"
        >
          JohnGalt_is_www
        </a>
        . Los números son tasas mensuales (%).
      </p>
      <DualesClient
        initialData={initialDualesData}
        initialTamarTEM={INITIAL_TAMAR_TEM}
      />
      <div className="mt-12">
        <CallValueComponent
          initialRequest={DEFAULT_CALL_VALUE_REQUEST}
          initialResponse={callValueData}
        />
      </div>
    </main>
  );
}
