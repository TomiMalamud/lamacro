import { CarryTradeClient } from "@/components/carry-trade/carry-trade-client";
import InlineLink from "@/components/inline-link";
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
        <InlineLink href="https://x.com/JohnGalt_is_www/status/1912555971400069372">
          JohnGalt_is_www
        </InlineLink>
        .
      </p>
      <CarryTradeClient
        carryTradeData={carryTradeResult}
        carryExitSimulation={carryExitSimulation}
      />
    </main>
  );
}
