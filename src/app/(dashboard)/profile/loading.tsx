import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-8 w-24 mb-8" />

      {/* Profile card */}
      <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6 mb-6 flex items-start gap-6">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Progress + stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6 flex items-center justify-center">
          <Skeleton className="w-[160px] h-[160px] rounded-full" />
        </div>
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>

      {/* Level progress */}
      <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6 mb-6">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-2 w-full rounded-full mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
