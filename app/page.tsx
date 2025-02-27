import dynamic from 'next/dynamic';

// Dynamically import the dashboard component to avoid SSR issues with charts
const BCRADashboard = dynamic(() => import('@/components/bcra/dashboard'), {
  ssr: true,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
    </div>
  ),
});


export default function Home() {
  return (
    <main className="min-h-screen mx-auto px-6 sm:px-16">
      <BCRADashboard />
    </main>
  );
}
