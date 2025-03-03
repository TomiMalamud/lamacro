// Add revalidation for the home page
export const revalidate = 3600; // Revalidate every hour

import dynamic from 'next/dynamic';

// Dynamically import the dashboard component to avoid SSR issues with charts
const BCRADashboard = dynamic(() => import('@/components/bcra/dashboard'), {
  ssr: true,
  loading: () => <DashboardSkeleton />,
});

// Skeleton component for better loading UX
function DashboardSkeleton() {
  return (
    <div className="space-y-8 py-8">
      <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 p-6 border rounded-lg">
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen mx-auto px-6 sm:px-16">
      <BCRADashboard />
    </main>
  );
}
