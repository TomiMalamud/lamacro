import { CarryTradeClient } from '@/components/carry-trade/carry-trade-client';
import { getCarryExitSimulation, getCarryTradeData } from '@/lib/carry-trade-data';

export const metadata = {
  title: 'Carry Trade',
  description: 'Calculadora y visualización de estrategias de carry trade con bonos argentinos.',
};

export default async function CarryTradePage() {
  const [carryTradeResult, carryExitSimulation] = await Promise.all([
    getCarryTradeData(),
    getCarryExitSimulation(),
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carry Trade</h1>
      <CarryTradeClient
        carryTradeData={carryTradeResult}
        carryExitSimulation={carryExitSimulation}
      />
    </main>
  );
} 