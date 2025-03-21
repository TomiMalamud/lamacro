import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

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
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 dark:bg-background`}
      >
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navigation />
            {children}
            <Footer />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
