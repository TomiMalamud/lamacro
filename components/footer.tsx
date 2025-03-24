import { ThemeToggle } from "./theme-toggle";

export function Footer() {
  return (
    <footer className="border-dashed border-t py-6 md:py-0">
      <div className="container-wrapper">
        <div className="container py-4 px-6 sm:px-16 flex items-center justify-between">
          <div className="text-balance text-sm leading-loose text-muted-foreground md:text-left">
            Creado por{" "}
            <a
              href={"https://x.com/tomasmalamud"}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Tomas Malamud
            </a>
            . Código disponible en{" "}
            <a
              href={"https://github.com/TomiMalamud/bcraenvivo"}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </div>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}