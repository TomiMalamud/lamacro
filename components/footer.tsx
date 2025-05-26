import InlineLink from "./inline-link";
import { ThemeToggle } from "./theme-toggle";

export function Footer() {
  return (
    <footer className="border-dashed border-t py-6 md:py-0">
      <div className="container-wrapper">
        <div className="container py-4 px-6 sm:px-16 flex items-center justify-between">
          <div className="text-balance text-sm leading-loose text-muted-foreground md:text-left">
            Creado por{" "}
            <InlineLink href={"https://x.com/tomasmalamud"}>
              Tomás Malamud
            </InlineLink>
            . Código disponible en{" "}
            <InlineLink href={"https://github.com/TomiMalamud/bcraenvivo"}>
              GitHub
            </InlineLink>
            . Utiliza la API del BCRA y de{" "}
            <InlineLink href="https://data912.com">
              Milton Casco Data Center
            </InlineLink>
            .
          </div>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
