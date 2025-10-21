'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface/30 border border-border ${className}`}
      aria-hidden="true"
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="flex-1 h-4" />
        </div>
      ))}
    </div>
  );
}

export function RoomListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-full h-4" />
            </div>
            <Skeleton className="w-24 h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-64 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="w-full h-16" />
        <Skeleton className="w-full h-16" />
      </div>
    </div>
  );
}













