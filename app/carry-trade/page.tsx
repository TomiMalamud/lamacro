import { getCarryTradeData, getCarryExitSimulation } from '@/lib/carry-trade-data';
import { CarryTradeClient } from '@/components/carry-trade/carry-trade-client';

export const metadata = {
  title: 'Carry Trade',
  description: 'Calculadora y visualización de estrategias de carry trade con bonos argentinos.',
};

// Helper component for loading state
// Loading state is now handled by loading.tsx

export default async function CarryTradePage() {
  // Fetch all data in parallel
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