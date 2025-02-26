import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | BCRA en Vivo',
    default: 'BCRA en Vivo - Visualización de Datos del Banco Central',
  },
  description: "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
  authors: [{ name: "BCRA en Vivo Team" }],
  metadataBase: new URL('https://bcraenvivo.vercel.app'),
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased px-6 sm:px-16 bg-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
