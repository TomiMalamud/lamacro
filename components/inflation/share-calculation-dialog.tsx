"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Copy, Share } from "lucide-react";
import * as React from "react";
import { FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { useRouter } from "next/navigation";

interface ShareCalculationDialogProps {
  startMonth: number;
  startYear: number;
  startValue: number;
  endMonth: number;
  endYear: number;
}

export function ShareCalculationDialog({
  startMonth,
  startYear,
  startValue,
  endMonth,
  endYear,
}: ShareCalculationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();

  const handleShare = async (type: "copy" | "twitter" | "whatsapp") => {
    // Update URL with current form values first
    const params = new URLSearchParams();
    params.set("startMonth", startMonth.toString());
    params.set("startYear", startYear.toString());
    params.set("startValue", startValue.toString());
    params.set("endMonth", endMonth.toString());
    params.set("endYear", endYear.toString());

    const newUrl = `/calculadora-de-inflacion?${params.toString()}`;
    router.replace(newUrl, { scroll: false });

    // Use the updated URL for sharing
    const shareUrl = `${window.location.origin}${newUrl}`;

    if (type === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("¡URL copiada al portapapeles!", {
          description: "Compartí el cálculo con tus amigos y familiares.",
        });
      } catch (err) {
        toast.error("Error al copiar", {
          description:
            "No se pudo copiar la URL. Por favor, copiala manualmente.",
        });
        console.error("Error copying to clipboard:", err);
      }
    } else if (type === "twitter") {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Calculadora de Inflación - La Macro")}`;
      window.open(twitterUrl, "_blank");
    } else if (type === "whatsapp") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Calculadora de Inflación - La Macro: " + shareUrl)}`;
      window.open(whatsappUrl, "_blank");
    }

    setOpen(false);
  };

  const ShareOptions = ({ className }: { className?: string }) => (
    <div className={cn("grid gap-4 my-4", className)}>
      <Button
        className="flex justify-start h-14"
        onClick={() => handleShare("copy")}
      >
        <Copy className="h-4 w-4 mr-2" />
        Copiar link para compartir
      </Button>

      <Button
        className="flex h-14 justify-start"
        onClick={() => handleShare("twitter")}
      >
        <FaXTwitter className="h-4 w-4 mr-2" />
        Compartir en X
      </Button>

      <Button
        className="flex h-14 text-black justify-start bg-[#25d366] hover:bg-[#25d366]/90"
        onClick={() => handleShare("whatsapp")}
      >
        <FaWhatsapp className="mr-2" />
        Compartir por WhatsApp
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Share size={16} className="mr-2" />
            Compartí el cálculo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] dark:bg-[#1C1C1E]">
          <DialogHeader>
            <DialogTitle>Compartir calculadora</DialogTitle>
            <DialogDescription>
              Elegí una opción para compartir esta calculadora de inflación.
            </DialogDescription>
          </DialogHeader>
          <ShareOptions />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <Share size={16} className="mr-2" />
          Compartí el cálculo
        </Button>
      </DrawerTrigger>
      <DrawerContent className="dark:bg-[#1C1C1E]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Compartir calculadora</DrawerTitle>
          <DrawerDescription>
            Elegí una opción para compartir esta calculadora de inflación.
          </DrawerDescription>
        </DrawerHeader>
        <ShareOptions className="px-4 pb-2" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="link">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
