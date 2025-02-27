'use client';

import { useState } from 'react';
import { VariableCard } from "@/components/bcra/variable-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BCRAVariable } from "@/lib/bcra-api";

interface RemainingVariablesSectionProps {
  variables: BCRAVariable[];
  totalCount: number;
}

export default function RemainingVariablesSection({ 
  variables, 
  totalCount 
}: RemainingVariablesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Show only 10 variables initially or all if showAll is true
  const displayedVariables = showAll 
    ? variables 
    : variables.slice(0, 10);
  
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">
        Otras Variables ({totalCount})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedVariables.map((variable: BCRAVariable) => (
          <VariableCard
            key={variable.idVariable}
            variable={variable}
            className="h-full"
          />
        ))}
      </div>
      
      {/* Show more/less button - only show if we have more than 10 variables */}
      {variables.length > 10 && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2"
          >
            {showAll ? (
              <>
                <span>Mostrar menos</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Mostrar {variables.length - 10} más</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}