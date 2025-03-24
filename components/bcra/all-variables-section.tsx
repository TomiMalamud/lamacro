'use client';

import { useState } from 'react';
import { VariableCard } from "@/components/bcra/variable-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BCRAVariable } from "@/lib/bcra-fetch";

// Helper function to normalize text (remove accents)
const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
};

interface AllVariablesSectionProps {
  variables: BCRAVariable[];
  totalCount: number;
  searchTerm: string;
}

export default function AllVariablesSection({ 
  variables, 
  totalCount,
  searchTerm 
}: AllVariablesSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter variables based on search term with accent-insensitive comparison
  const filteredVariables = variables.filter((variable) => {
    const normalizedDescription = normalizeText(variable.descripcion || "");
    const normalizedSearch = normalizeText(searchTerm);
    return normalizedDescription.includes(normalizedSearch);
  });

  // Show only 3 variables initially or all if showAll is true, applied to filtered results
  const displayedVariables = showAll 
    ? filteredVariables 
    : filteredVariables.slice(0, 3);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">
        Todas las variables ({totalCount})
      </h2>

      {filteredVariables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedVariables.map((variable: BCRAVariable) => (
            <VariableCard
              key={variable.idVariable}
              variable={variable}
              className="h-full"
              disableTrend={true}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-4">
          No se encontraron variables que coincidan con la búsqueda
        </p>
      )}
      
      {/* Show more/less button - only show if we have more than 3 filtered variables */}
      {filteredVariables.length > 3 && (
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
                <span>Mostrar {filteredVariables.length - 3} más</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}