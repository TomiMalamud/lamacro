import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    template: "%s | La Macro",
    default: "La Macro - Datos de la Macroeconomía Argentina",
  },
  description:
    "Central de deudores, inflación, reservas, dólar, tasas, y calculadora de carry trade.",
  authors: [{ name: "Tomas Malamud" }],
  metadataBase: new URL("https://lamacro.ar"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://lamacro.ar",
    siteName: "La Macro",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Macro - Datos de la Macroeconomía Argentina",
    description:
      "Central de deudores, inflación, reservas, dólar, tasas, y calculadora de carry trade.",
    creator: "@tomasmalamud",
  },
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
            <SpeedInsights />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
