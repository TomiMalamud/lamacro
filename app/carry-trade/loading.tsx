import { Skeleton } from '@/components/ui/skeleton';

// Use the standard Next.js loading file convention
export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-8 w-1/4" />
       <Skeleton className="h-[400px] w-full" />
    </div>
  );
} 