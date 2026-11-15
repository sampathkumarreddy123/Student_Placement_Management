import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-[#DBEAFE]/60 rounded ${className}`} />;
};

export const StatsCardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-[#DBEAFE] shadow-sm">
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
        <div key={i} className="bg-white p-5 rounded-xl border border-[#DBEAFE] shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#DBEAFE]">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          <Skeleton className="h-5 w-3/4 my-2" />

          <div className="flex items-baseline justify-between pb-3 border-b border-[#DBEAFE]/60">
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>

          <div className="flex justify-between pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>

          <div className="pt-2 border-t border-[#DBEAFE]">
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-xl border border-[#DBEAFE] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#DBEAFE] bg-[#F0F7FF] flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-[#DBEAFE]/60 p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between gap-4 py-2.5">
            <div className="flex items-center gap-3 w-1/3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
