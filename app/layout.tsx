import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
    template: "%s | La Macro",
    default: "La Macro - Visualización de Datos del Banco Central"
  },
  description:
    "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
  authors: [{ name: "La Macro Team" }],
  metadataBase: new URL("https://lamacro.ar"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://lamacro.ar",
    siteName: "La Macro",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "La Macro"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "La Macro - Visualización de Datos del Banco Central",
    description:
      "Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.",
    creator: "@tomasmalamud",
    images: [
      {
        url: "/twitter-image.jpg",
        width: 1200,
        height: 630,
        alt: "La Macro"
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
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
