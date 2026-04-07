import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <div className="max-w-lg mx-auto pb-24 px-4">
      <Skeleton className="h-8 w-52 mt-6 mb-1" />
      <Skeleton className="h-4 w-80 mb-8" />

      {/* Form sections */}
      <div className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
