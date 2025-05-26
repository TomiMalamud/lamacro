"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import InlineLink from "@/components/inline-link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CarryTradeError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container min-h-screen mt-24 mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">
        Algo salió mal!
      </h2>
      <p className="mb-4">
        Avisame de este error por{" "}
        <InlineLink href="https://x.com/tomasmalamud">X</InlineLink>
        {" 🙏"}
      </p>
      <p className="text-muted-foreground mb-1 mt-8">o si no, </p>
      <Button onClick={() => reset()}>Intentá de nuevo</Button>
    </div>
  );
}
