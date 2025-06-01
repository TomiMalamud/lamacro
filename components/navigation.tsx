import {
  ChartArea,
  Search,
  Calculator,
  DollarSign,
  BarChart3,
  ChartPie,
} from "lucide-react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { LucideIcon } from "lucide-react";
import { MobileNav } from "./mobile-nav";

interface NavigationLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prefetch?: boolean;
}

export const navigationLinks: NavigationLink[] = [
  {
    href: "/variables",
    label: "Estadísticas",
    description:
      "Accedé a las principales estadísticas del BCRA: inflación, reservas, dólar, etc.",
    icon: ChartArea,
  },
  {
    href: "/debts/search",
    label: "Central de Deudores",
    description: "Consultá información sobre deudores del sistema financiero",
    icon: Search,
    prefetch: true,
  },
  {
    href: "/inflation-calculator",
    label: "Calculadora de Inflación",
    description:
      "Mirá cuánto vale hoy tu compra, inversión o deuda del pasado.",
    icon: Calculator,
    prefetch: true,
  },
  {
    href: "/carry-trade",
    label: "Carry Trade",
    description:
      "Fijate cuál es el mejor bono para hacer carry trade. Se actualiza casi a tiempo real. ",
    icon: DollarSign,
  },
  {
    href: "/duales",
    label: "Duales TAMAR",
    description: "Análisis avanzado de duales TAMAR.",
    icon: BarChart3,
    prefetch: false,
  },
  {
    href: "/fija",
    label: "Renta Fija",
    description: "Análisis de letras y bonos con cálculos de TNA, TEM y TEA",
    icon: ChartPie,
  },
];

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <MobileNav />

        <div className="flex items-center sm:flex-initial flex-1 justify-center sm:justify-start">
          <Link href="/" className="flex items-center" prefetch={true}>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r dark:from-blue-400 dark:via-yellow-100 dark:to-blue-400 from-blue-500 via-sky-400 to-blue-500">
              La Macro
            </span>
          </Link>
        </div>

        <div className="hidden sm:flex">
          <NavigationMenu className="ml-2 text-left">
            <NavigationMenuList>
              {navigationLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild className="font-medium">
                    <Link href={link.href} prefetch={link.prefetch}>
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="sm:hidden w-10"></div>
      </div>
    </nav>
  );
}
