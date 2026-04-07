import { Skeleton } from '@/components/ui/skeleton';

export default function RecordsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* PR Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-8 ml-2" />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a3a]">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
