import { Skeleton, ProgramCardSkeleton } from '@/components/ui/skeleton';

export default function ProgramsLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Coach carousel skeleton */}
      <div className="mb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-5">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-3 w-3/4 mb-4" />
              <div className="grid grid-cols-3 gap-3 border-t border-[#2a2a3a] pt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Program grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
        <ProgramCardSkeleton />
      </div>
    </div>
  );
}
