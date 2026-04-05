import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function CreatorDashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <Skeleton className="h-5 w-44 mb-4" />
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[140px] w-[140px] rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}
