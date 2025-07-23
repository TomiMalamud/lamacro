import CallValueComponent, {
  DEFAULT_CALL_VALUE_REQUEST,
} from "@/components/duales-tamar/call-value";
import DualesClient from "@/components/duales-tamar/duales-client";
import InlineLink from "@/components/inline-link";
import { getDualBondSimulationData } from "@/lib/duales";

export const metadata = {
  title: "Análisis de Bonos Duales TAMAR",
  description:
    "Análisis y simulación de bonos duales TAMAR con diferentes escenarios de TEM.",
};

export const revalidate = 3600; // 1 hour

const INITIAL_TAMAR_TEM = 0.02;

export default async function CallsPage() {
  const initialDualesData = await getDualBondSimulationData();

  return (
    <main className="container mx-auto px-6 md:px-16 py-8">
      <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
      <p className="text-muted-foreground mb-8">
        Cálculos hechos por{" "}
        <InlineLink href="https://x.com/JohnGalt_is_www/">
          JohnGalt_is_www
        </InlineLink>
        . Los números son tasas mensuales (%).
      </p>
      <DualesClient
        initialData={initialDualesData}
        initialTamarTEM={INITIAL_TAMAR_TEM}
      />
      <div className="mt-12">
        <CallValueComponent
          initialRequest={DEFAULT_CALL_VALUE_REQUEST}
          initialResponse={null}
        />
      </div>
    </main>
  );
}
