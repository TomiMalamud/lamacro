"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

interface ClipboardLinkProps {
  href: string;
  id?: string;
  children: React.ReactNode;
  description?: string;
}

export function ClipboardLink({
  href,
  id,
  children,
  description,
}: ClipboardLinkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  // Handle countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isDialogOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isDialogOpen, timeLeft]);

  const handleNavigate = useCallback(() => {
    window.open(href, "_blank");
    setIsDialogOpen(false);
    setCopied(false);
    setTimeLeft(5);
  }, [href]);

  // Handle auto-navigation when countdown reaches zero
  useEffect(() => {
    if (timeLeft === 0) {
      // Schedule state updates to avoid direct calls
      const resetState = () => {
        setIsDialogOpen(false);
        setCopied(false);
        setTimeLeft(5);
      };

      window.open(href, "_blank");
      setTimeout(resetState, 0);
    }
  }, [timeLeft, href]);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!id) return;
    e.preventDefault();

    // Try to copy first
    const success = await copy(id);

    // Show dialog and toast if copy was successful
    if (success) {
      setCopied(true);
      toast.success("CUIT/CUIL copiado!");
      setTimeLeft(5);
      setIsDialogOpen(true);
    } else {
      toast.error("No se pudo copiar el CUIT/CUIL");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCopied(false);
    }
  };

  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={id ? handleClick : undefined}
        className="text-blue-500 hover:underline block"
      >
        {children}
      </a>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {id && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>CUIT/CUIL copiado!</DialogTitle>
              <DialogDescription>
                Copiamos el CUIT que consultaste! Sólo tenés que pegarlo (CTRL +
                V) en la página de destino.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              <div className="grid flex-1 gap-2">
                <div className="flex items-center justify-between">
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {id}
                  </code>
                  <div className="flex items-center gap-2">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Redirigiendo en {timeLeft}s...
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNavigate}>Ir ahora</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
