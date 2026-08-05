"use client";

export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`shimmer bg-warm-gray/10 rounded-sm ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-parchment text-ink border border-brass/30 rounded-sm p-6 flex flex-col gap-5 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-sm" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="h-6 w-20 rounded-sm" />
      </div>

      {/* Summary text lines */}
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-sm" />
        <Skeleton className="h-20 w-full rounded-sm" />
      </div>

      {/* Tags row */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-7 w-16 rounded-sm" />
        <Skeleton className="h-7 w-20 rounded-sm" />
        <Skeleton className="h-7 w-14 rounded-sm" />
        <Skeleton className="h-7 w-24 rounded-sm" />
        <Skeleton className="h-7 w-16 rounded-sm" />
      </div>
    </div>
  );
}
