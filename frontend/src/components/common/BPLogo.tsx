import React from 'react';

export interface BPLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BPLogo: React.FC<BPLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-7 w-auto max-w-[120px]',
    md: 'h-9 w-auto max-w-[150px]',
    lg: 'h-12 w-auto max-w-[180px]',
    xl: 'h-16 w-auto max-w-[220px]',
  };

  return (
    <img
      src="/NexFlow.png"
      alt="NexFlow"
      className={`object-contain select-none shrink-0 ${sizeClasses[size]} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

export const NexFlowLogo = BPLogo;

