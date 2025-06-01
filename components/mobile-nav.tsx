"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { navigationLinks } from "./navigation";

export function MobileNav() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="sm:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-10/12">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-6 p-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-2xl font-medium"
                prefetch={link.prefetch}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
