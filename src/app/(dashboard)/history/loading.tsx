import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-3 w-56" />
      </div>

      {/* Session List */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-40 mb-1.5" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-20 flex-shrink-0 ml-3" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
