'use client';

import { useState } from 'react';
import { VariableCard } from "@/components/bcra/variable-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { ChevronDown, ChevronUp } from "lucide-react";
import { BCRAVariable } from "@/lib/bcra-api";

interface AllVariablesSectionProps {
  variables: BCRAVariable[];
  totalCount: number;
}

export default function AllVariablesSection({ 
  variables, 
  totalCount 
}: AllVariablesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter variables based on search term
  const filteredVariables = variables.filter((variable) =>
    variable.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show only 10 variables initially or all if showAll is true, applied to filtered results
  const displayedVariables = showAll 
    ? filteredVariables 
    : filteredVariables.slice(0, 10);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">
        Todas las variables ({totalCount})
      </h2>

      {/* Add search input */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Buscar variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredVariables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedVariables.map((variable: BCRAVariable) => (
            <VariableCard
              key={variable.idVariable}
              variable={variable}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-4">
          No se encontraron variables que coincidan con la búsqueda
        </p>
      )}
      
      {/* Show more/less button - only show if we have more than 10 filtered variables */}
      {filteredVariables.length > 10 && (
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
                <span>Mostrar {filteredVariables.length - 10} más</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}