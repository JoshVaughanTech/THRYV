import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </header>

      {/* Notification List */}
      <div className="px-5 pb-24 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-[#2a2a3a] bg-[#15151f] p-4"
          >
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-12 flex-shrink-0" />
              </div>
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
