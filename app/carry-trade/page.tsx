import { CarryTradeClient } from "@/components/carry-trade/carry-trade-client";
import DualesTamarPage from "@/components/duales-tamar/duales";
import { getCarryExitSimulation, getCarryTradeData } from "@/lib/carry-trade";

export const metadata = {
  title: "Carry Trade",
  description:
    "Calculadora y visualización de estrategias de carry trade con bonos argentinos.",
};

export default async function CarryTradePage() {
  const [carryTradeResult, carryExitSimulation] = await Promise.all([
    getCarryTradeData(),
    getCarryExitSimulation(),
  ]);

  return (
    <main className="container mx-auto px-6 md:px-16 py-8">
      <h1 className="text-3xl font-bold mb-2">Carry Trade</h1>
      <p className="text-muted-foreground mb-8">
        Fijate cuál es el mejor bono para hacer carry trade. Se actualiza casi a
        tiempo real. Inspirado en el gran{" "}
        <a
          href="https://x.com/JohnGalt_is_www/status/1912555971400069372"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:decoration-stone-900 hover:text-stone-900 dark:hover:decoration-stone-200 dark:hover:text-stone-200 transition-all duration-300"
        >
          JohnGalt_is_www
        </a>
        . Usa la API de{" "}
        <a
          href="https://data912.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:decoration-slate-200 hover:text-slate-200 dark:hover:decoration-slate-400 dark:hover:text-slate-400 transition-all duration-300"
        >
          Milton Casco
        </a>
        .
      </p>
      <CarryTradeClient
        carryTradeData={carryTradeResult}
        carryExitSimulation={carryExitSimulation}
      />
      <DualesTamarPage />
    </main>
  );
}
