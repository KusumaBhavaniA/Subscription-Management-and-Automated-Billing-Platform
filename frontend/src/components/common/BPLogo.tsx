import React from 'react';

export interface BPLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BPLogo: React.FC<BPLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-2xl',
    xl: 'w-16 h-16 text-2xl rounded-2xl',
  };

  return (
    <div
      className={`inline-flex items-center justify-center font-black tracking-tighter text-white bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-600 shadow-md shadow-indigo-500/25 select-none shrink-0 ${sizeClasses[size]} ${className}`}
    >
      BP
    </div>
  );
};
