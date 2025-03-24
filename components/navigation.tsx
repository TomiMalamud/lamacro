import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mx-auto sm:ml-2 sm:text-left">
          <Link href="/" className="flex items-center" prefetch={true}>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r dark:from-blue-400 dark:via-yellow-100 dark:to-blue-400 from-blue-500 via-sky-400 to-blue-500">BCRA en Vivo</span>
          </Link>
        </div>
        <NavigationMenu className="ml-2 hidden sm:block text-left">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link
                href="/stats"
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