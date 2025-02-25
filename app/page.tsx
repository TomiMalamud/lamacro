import dynamic from 'next/dynamic';
import { Metadata } from 'next';

// Dynamically import the dashboard component to avoid SSR issues with charts
const BCRADashboard = dynamic(() => import('@/components/bcra/dashboard'), {
  ssr: true,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
    </div>
  ),
});

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: 'BCRA en Vivo - Visualización de Datos del Banco Central',
  description: 'Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.',
  openGraph: {
    title: 'BCRA en Vivo - Visualización de Datos del Banco Central',
    description: 'Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://bcraenvivo.vercel.app',
    siteName: 'BCRA en Vivo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BCRA en Vivo - Visualización de Datos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BCRA en Vivo - Visualización de Datos del Banco Central',
    description: 'Visualización interactiva de variables monetarias y financieras del Banco Central de la República Argentina (BCRA) actualizadas diariamente.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return (
    <main className="min-h-screen mx-auto">
      <BCRADashboard />
    </main>
  );
}
