"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { navMain } from "./navigation";
import { Button } from "./ui/button";

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
          <SheetHeader className="px-6">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-12 p-6 ">
            {navMain.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  {group.title}
                </span>
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className="flex items-center space-x-4 text-xl font-medium"
                    prefetch={item.prefetch}
                    onClick={handleLinkClick}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
