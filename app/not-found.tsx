import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center text-center space-y-4 justify-center h-screen">
      <div className="text-4xl pb-8">🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷</div>
      <h1 className="text-4xl font-bold">404 - Página no encontrada 🧉</h1>
      <p className="text-muted-foreground">La página que estás buscando no existe.</p>
      <Button variant="link" asChild className="text-blue-500 hover:text-blue-600">
        <Link href="/">Volver a la página principal</Link>
      </Button>
      <div className="text-4xl pt-8">🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷🇦🇷</div>
    </div>
  );
}