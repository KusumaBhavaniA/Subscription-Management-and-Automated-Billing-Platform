import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  const variantStyles = {
    success: 'bg-success-bg text-success-text border-success-border',
    warning: 'bg-warning-bg text-warning-text border-warning-border',
    error: 'bg-danger-bg text-danger-text border-danger-border',
    info: 'bg-primary/10 text-primary border-primary/20',
    neutral: 'bg-secondary text-secondaryText border-border',
    brand: 'bg-primary/15 text-primary border-primary/30',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-bold',
    md: 'px-2.5 py-1 text-xs font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} uppercase tracking-wider select-none`}
    >
      {children}
    </span>
  );
};
