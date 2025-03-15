import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 flex hidden sm:block">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold">BCRA en Vivo</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium transition-colors hover:bg-accent rounded-md"
            >
              Variables
            </Link>
            <Link
              href="/debts/search"
              className="px-4 py-2 text-sm font-medium transition-colors hover:bg-accent rounded-md"
            >
              Central de Deudores
            </Link>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
} 