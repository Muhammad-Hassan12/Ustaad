"use client";

export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`shimmer bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5 overflow-hidden">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Summary text lines */}
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* Tags row */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-14 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}
