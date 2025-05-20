import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center" prefetch={true}>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r dark:from-blue-400 dark:via-yellow-100 dark:to-blue-400 from-blue-500 via-sky-400 to-blue-500">
              La Macro
            </span>
          </Link>
        </div>

        <div className="hidden sm:flex">
          <NavigationMenu className="ml-2 text-left">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/stats" prefetch={true} legacyBehavior passHref>
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
                  href="/inflation-calculator"
                  prefetch={true}
                  legacyBehavior
                  passHref
                >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Calculadora de Inflación
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/carry-trade"
                  prefetch={true}
                  legacyBehavior
                  passHref
                >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Carry Trade
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="sm:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Navegación</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pb-0">
                  <nav className="flex flex-col space-y-2">
                    <DrawerClose asChild>
                      <Link
                        href="/stats"
                        prefetch={true}
                        className="text-lg font-medium hover:underline"
                      >
                        Estadísticas
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        href="/debts/search"
                        prefetch={true}
                        className="text-lg font-medium hover:underline"
                      >
                        Central de Deudores
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        href="/inflation-calculator"
                        prefetch={true}
                        className="text-lg font-medium hover:underline"
                      >
                        Calculadora de Inflación
                      </Link>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Link
                        href="/carry-trade"
                        prefetch={true}
                        className="text-lg font-medium hover:underline"
                      >
                        Carry Trade
                      </Link>
                    </DrawerClose>
                  </nav>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}
