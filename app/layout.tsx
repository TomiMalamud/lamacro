import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | BCRA en Vivo",
    default: "BCRA en Vivo - Visualización de Datos del Banco Central"
  },
  description:
    "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
  authors: [{ name: "BCRA en Vivo Team" }],
  metadataBase: new URL("https://bcra.tmalamud.com"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://bcra.tmalamud.com",
    title: "BCRA en Vivo - Visualización de Datos del Banco Central",
    description:
      "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
    siteName: "BCRA en Vivo",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "BCRA en Vivo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BCRA en Vivo - Visualización de Datos del Banco Central",
    description:
      "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
    creator: "@tomasmalamud",
    images: [
      {
        url: "/twitter-image.jpg",
        width: 1200,
        height: 630,
        alt: "BCRA en Vivo"
      }
    ]
  }
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased px-6 sm:px-16 bg-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
