import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-lg',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-400',
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-primary/10 text-primary border border-primary/20 font-black flex items-center justify-center overflow-hidden shadow-2xs`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-surface ${statusDotSizes[size]} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
