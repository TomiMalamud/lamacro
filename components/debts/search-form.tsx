"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  initialValue?: string;
}

export function SearchForm({ initialValue = "" }: SearchFormProps) {
  const router = useRouter();

  // Format CUIT/CUIL with dashes (XX-XXXXXXXX-X)
  const formatCUIT = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  };

  // Get clean digits for API calls
  const getSanitizedValue = (value: string): string => value.replace(/\D/g, "");

  const [value, setValue] = useState(formatCUIT(initialValue));
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedValue = getSanitizedValue(value);

    // Validate CUIT/CUIL
    if (!sanitizedValue) {
      setError("Ingresá un CUIT/CUIL");
      return;
    }

    if (sanitizedValue.length !== 11) {
      setError("El CUIT/CUIL debe tener 11 dígitos");
      return;
    }

    // Clear error and navigate
    setError("");
    router.push(`/deudores/${sanitizedValue}`);
  };

  // Handle input change and enable prefetching on valid input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCUIT(inputValue);
    setValue(formattedValue);

    // Clear previous error
    if (error) setError("");

    // Prefetch if valid CUIT/CUIL (11 digits)
    const sanitizedValue = getSanitizedValue(formattedValue);
    if (sanitizedValue.length === 11) {
      router.prefetch(`/deudores/${sanitizedValue}`);
    }
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col space-y-2">
        <label htmlFor="id" className="text-sm font-medium">
          {initialValue ? "Corregí el CUIT/CUIL" : "CUIT/CUIL"}
        </label>
        <Input
          id="id"
          value={value}
          onChange={handleInputChange}
          type="text"
          placeholder="Ej: 30-70308853-4"
          maxLength={13}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Ingresá el CUIT/CUIL a consultar
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex justify-end">
        <Button type="submit">Buscar</Button>
      </div>
    </form>
  );
}
