// Add revalidation for the home page
export const revalidate = 3600; // Revalidate every hour

import dynamic from 'next/dynamic';

// Dynamically import the dashboard component with proper settings
const BCRADashboard = dynamic(() => import('@/components/bcra/dashboard'), {
  ssr: true
});

export default function Home() {
  return (
    <main className="min-h-screen mx-auto px-6 sm:px-16">
      <BCRADashboard />
    </main>
  );
}
