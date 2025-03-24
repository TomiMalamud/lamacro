import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 hidden sm:block">
          <Link href="/" className="flex items-center" prefetch={true}>
            <span className="text-lg font-bold">BCRA en Vivo</span>
          </Link>
        </div>
        <NavigationMenu className="ml-2 overflow-x-auto">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link
                href="/"
                prefetch={true}
                legacyBehavior
                passHref
              >
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Estadísticas
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/debts/search"
                prefetch={true}
                legacyBehavior
                passHref
              >
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Central de Deudores
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/inflation"
                prefetch={true}
                legacyBehavior
                passHref
              >
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Calculadora de Inflación
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
} 