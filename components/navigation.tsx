import {
  BarChart3,
  Calculator,
  ChartArea,
  ChartNoAxesCombined,
  DollarSign,
  LucideIcon,
  PieChart,
  Search,
} from "lucide-react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

interface NavigationItem {
  title: string;
  url: string;
  description: string;
  icon?: LucideIcon;
  iconSrc: string;
  iconAlt: string;
  prefetch?: boolean;
}

interface NavigationGroup {
  title: string;
  url: string;
  items: NavigationItem[];
}

export const navMain: NavigationGroup[] = [
  {
    title: "Finanzas",
    url: "#",
    items: [
      {
        title: "Acciones",
        url: "/acciones",
        description: "Mirá los retornos del año del Merval.",
        icon: ChartNoAxesCombined,
        iconSrc: "/stocks.png",
        iconAlt: "Stock chart icon",
      },
      {
        title: "Carry Trade",
        url: "/carry-trade",
        description: "Fijate cuál es el mejor bono para hacer carry trade.",
        icon: DollarSign,
        iconSrc: "/money.png",
        iconAlt: "Money icon",
      },
      {
        title: "Duales TAMAR",
        url: "/duales",
        description: "Mirá un análisis avanzado de duales TAMAR.",
        icon: BarChart3,
        iconSrc: "/excel.png",
        iconAlt: "Excel chart icon",
        prefetch: false,
      },
      {
        title: "Renta Fija",
        url: "/fija",
        description: "Encontrá el mejor bono para invertir en renta fija.",
        icon: PieChart,
        iconSrc: "/charts.png",
        iconAlt: "Charts icon",
      },
    ],
  },
  {
    title: "BCRA",
    url: "#",
    items: [
      {
        title: "Macroeconomía",
        url: "/variables",
        description:
          "Mirá las principales estadísticas del BCRA: inflación, reservas, dólar, etc.",
        icon: ChartArea,
        iconSrc: "/trending.png",
        iconAlt: "Trending chart icon",
      },
      {
        title: "Central de Deudores",
        url: "/deudores",
        description:
          "Consultá información sobre deudores del sistema financiero",
        icon: Search,
        iconSrc: "/magnifying.png",
        iconAlt: "Magnifying glass icon",
        prefetch: true,
      },
      {
        title: "Calculadora de Inflación",
        url: "/inflation-calculator",
        description:
          "Mirá cuánto vale hoy tu compra, inversión o deuda del pasado.",
        icon: Calculator,
        iconSrc: "/calculator.png",
        iconAlt: "Calculator icon",
        prefetch: true,
      },
    ],
  },
];

export const navigationLinks: NavigationItem[] = navMain.flatMap(
  (group) => group.items,
);

export const inversionesLinks: NavigationItem[] =
  navMain.find((group) => group.title === "Finanzas")?.items || [];

export function Navigation() {
  const finanzasGroup = navMain.find((group) => group.title === "Finanzas");
  const bcraGroup = navMain.find((group) => group.title === "BCRA");

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
          <NavigationMenu className="ml-2 text-left" viewport={false}>
            <NavigationMenuList>
              {finanzasGroup && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-medium">
                    {finanzasGroup.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="group-data-[viewport=false]/navigation-menu:rounded-xl z-50">
                    <ul className="grid w-sm">
                      {finanzasGroup.items.map((item) => (
                        <li key={item.url}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.url}
                              prefetch={item.prefetch}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center gap-2">
                                {item.icon && <item.icon className="h-4 w-4" />}
                                <div className="text-sm font-medium leading-none">
                                  {item.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
              {bcraGroup?.items.map((item) => (
                <NavigationMenuItem key={item.url}>
                  <NavigationMenuLink asChild className="font-medium">
                    <Link href={item.url} prefetch={item.prefetch}>
                      {item.title}
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
