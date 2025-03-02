"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CUIT/CUIL
    if (!id) {
      setError("Ingresa un CUIT/CUIL");
      return;
    }
    
    if (!/^\d+$/.test(id)) {
      setError("El CUIT/CUIL debe contener solo números");
      return;
    }
    
    if (id.length !== 11) {
      setError("El CUIT/CUIL debe tener 11 dígitos");
      return;
    }
    
    // Clear error and navigate
    setError("");
    router.push(`/debts/${id}`);
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col space-y-2">
        <label htmlFor="id" className="text-sm font-medium">
          CUIT/CUIL
        </label>
        <Input
          id="id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="text"
          placeholder="Ej: 20123456789"
          maxLength={11}
        />
        <p className="text-xs text-muted-foreground">
          Ingresa los 11 dígitos sin guiones ni espacios
        </p>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button type="submit">
          Buscar
        </Button>
      </div>
    </form>
  );
} 