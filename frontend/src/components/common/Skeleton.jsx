import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />;
};

export const StatsCardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-14" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DriveCardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
            <Skeleton className="h-8 rounded" />
            <Skeleton className="h-8 rounded" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          <div className="pt-2 flex gap-2 border-t border-slate-100">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-3 w-24 hidden sm:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

