"use client";

import { InflationForm } from "@/components/inflation/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

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

function InflationCalculatorContent() {
  const searchParams = useSearchParams();
  const { copyText } = useClipboard();
  const { toast } = useToast()

  // Parse URL parameters with fallbacks
  const startMonth = searchParams.get("startMonth") ? parseInt(searchParams.get("startMonth")!) : undefined;
  const startYear = searchParams.get("startYear") ? parseInt(searchParams.get("startYear")!) : undefined;
  const startValue = searchParams.get("startValue") ? parseFloat(searchParams.get("startValue")!) : undefined;
  const endMonth = searchParams.get("endMonth") ? parseInt(searchParams.get("endMonth")!) : undefined;
  const endYear = searchParams.get("endYear") ? parseInt(searchParams.get("endYear")!) : undefined;

  return (
    <div className="container mx-auto text-center py-8 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-6">Calculadora de Inflación</h1>
      
      <Card>
        <CardContent className="p-4 text-center">
          <InflationForm 
            defaultStartMonth={startMonth}
            defaultStartYear={startYear}
            defaultStartValue={startValue}
            defaultEndMonth={endMonth}
            defaultEndYear={endYear}
          />
        </CardContent>
        <CardFooter className="flex justify-center pb-4">

          <Button
            onClick={async () => {
              const success = await copyText(window.location.href);
              if (success) {
                toast({
                  title: "¡URL copiada al portapapeles!",
                  description: "Compartí el cálculo con tus amigos y familiares.",
                });
              } else {
                toast({
                  title: "Error al copiar",
                  description: "No se pudo copiar la URL. Por favor, copiala manualmente.",
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
          >
            <Share size={16} className="mr-2" />
            Compartí el cálculo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function InflationCalculatorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InflationCalculatorContent />
    </Suspense>
  );
}
