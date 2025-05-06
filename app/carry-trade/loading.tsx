import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
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
