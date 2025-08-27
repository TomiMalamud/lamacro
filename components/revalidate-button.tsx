"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";

interface RevalidateButtonClientProps {
  action: () => Promise<void>;
}

const SubmitButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(function SubmitButton(props, ref) {
  const { pending } = useFormStatus();
  return (
    <Button
      ref={ref}
      type="submit"
      variant="ghost"
      size="icon"
      aria-label="Traer últimos datos"
      disabled={pending}
      {...props}
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
    </Button>
  );
});

export default function RevalidateButtonClient({
  action,
}: RevalidateButtonClientProps) {
  return (
    <form action={action}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SubmitButton />
        </TooltipTrigger>
        <TooltipContent side="left">Traer últimos datos</TooltipContent>
      </Tooltip>
    </form>
  );
}
