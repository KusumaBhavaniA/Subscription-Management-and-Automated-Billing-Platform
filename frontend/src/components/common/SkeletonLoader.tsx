import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-secondary/80 dark:bg-slate-800/80 ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full space-y-3 p-4">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2.5 items-center">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 flex-1 ${c === 0 ? 'h-5 max-w-[140px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${
            i === lines - 1 ? 'w-2/3' : i === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-xl',
  };
  return <Skeleton className={`${sizeClasses[size]} shrink-0 ${className}`} />;
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-16 h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Aliases for standard naming
export const SkeletonCard: React.FC<{ count?: number }> = (props) => <CardSkeleton {...props} />;
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = (props) => <TableSkeleton {...props} />;

export default Skeleton;



