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
import { useEffect, useState } from "react";

function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyText = async (text: string) => {
    if (!text) return false;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        return true;
      }

      // iOS Safari fallback
      const isIOS = /ipad|iphone|ipod/.test(
        window.navigator.userAgent.toLowerCase()
      );

      if (isIOS) {
        // Create an off-screen input element
        const input = document.createElement('input');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        input.value = text;
        input.setAttribute('readonly', ''); // Prevent keyboard from showing on mobile
        
        // Add to DOM
        document.body.appendChild(input);
        
        // Select the input
        input.focus();
        input.select();
        input.setSelectionRange(0, text.length);
        
        // Copy
        const success = document.execCommand('copy');
        
        // Cleanup
        document.body.removeChild(input);

        setCopied(success);
        return success;
      }

      // Non-iOS fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(success);
      return success;
    } catch (err) {
      console.warn('Copy failed:', err);
      setCopied(false);
      return false;
    }
  };

  return { copied, copyText };
}

interface ClipboardLinkProps {
  href: string;
  id?: string;
  children: React.ReactNode;
  description?: string;
}

export function ClipboardLink({ href, id, children, description }: ClipboardLinkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const { copied, copyText } = useClipboard();

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

  // Handle auto-navigation when countdown reaches zero
  useEffect(() => {
    if (timeLeft === 0) {
      handleNavigate();
    }
  }, [timeLeft]);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!id) return;
    e.preventDefault();
    
    // Try to copy first
    const success = await copyText(id);
    
    // Only show dialog if copy was successful or at least attempted
    if (success) {
      setTimeLeft(5);
      setIsDialogOpen(true);
    }
  };

  const handleNavigate = () => {
    window.open(href, "_blank");
    setIsDialogOpen(false);
    setTimeLeft(5); // Reset for next time
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>CUIT/CUIL copiado!</DialogTitle>
              <DialogDescription>
                Copiamos el CUIT que consultaste! Sólo tenés que pegarlo (CTRL + V) en
                la página de destino.
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
                <Button onClick={handleNavigate}>
                  Ir ahora
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}