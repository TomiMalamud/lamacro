import {
  BarChart3,
  Calculator,
  ChartArea,
  DollarSign,
  LucideIcon,
  PieChart,
  Search,
} from "lucide-react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";

interface NavigationLink {
  href: string;
  label: string;
  description: string;
  icon?: LucideIcon;
  iconSrc: string;
  iconAlt: string;
  prefetch?: boolean;
}

export const navigationLinks: NavigationLink[] = [
  {
    href: "/variables",
    label: "Estadísticas",
    description:
      "Mirá las principales estadísticas del BCRA: inflación, reservas, dólar, etc.",
    icon: ChartArea,
    iconSrc: "/trending.png",
    iconAlt: "Trending chart icon",
  },
  {
    href: "/debts/search",
    label: "Central de Deudores",
    description: "Consultá información sobre deudores del sistema financiero",
    icon: Search,
    iconSrc: "/magnifying.png",
    iconAlt: "Magnifying glass icon",
    prefetch: true,
  },
  {
    href: "/inflation-calculator",
    label: "Calculadora de Inflación",
    description:
      "Mirá cuánto vale hoy tu compra, inversión o deuda del pasado.",
    icon: Calculator,
    iconSrc: "/calculator.png",
    iconAlt: "Calculator icon",
    prefetch: true,
  },
  {
    href: "/carry-trade",
    label: "Carry Trade",
    description: "Fijate cuál es el mejor bono para hacer carry trade.",
    icon: DollarSign,
    iconSrc: "/money.png",
    iconAlt: "Money icon",
  },
  {
    href: "/duales",
    label: "Duales TAMAR",
    description: "Mirá un análisis avanzado de duales TAMAR.",
    icon: BarChart3,
    iconSrc: "/excel.png",
    iconAlt: "Excel chart icon",
    prefetch: false,
  },
  {
    href: "/fija",
    label: "Renta Fija",
    description: "Encontrá el mejor bono para invertir en renta fija.",
    icon: PieChart,
    iconSrc: "/charts.png",
    iconAlt: "Charts icon",
  },
];

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
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
