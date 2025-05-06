"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CarryTradeError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">
        Algo salió mal!
      </h2>
      <p className="mb-4">
        No se pudieron cargar los datos para la página de Carry Trade.
      </p>
      <Button onClick={() => reset()}>Intentar de nuevo</Button>
    </div>
  );
}
