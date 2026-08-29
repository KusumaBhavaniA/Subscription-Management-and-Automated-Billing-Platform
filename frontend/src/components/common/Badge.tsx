import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'
  | 'ACTIVE'
  | 'PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'RESOLVED'
  | 'FAILED';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const normalizedVariant = (() => {
    switch (variant) {
      case 'ACTIVE':
      case 'PAID':
      case 'RESOLVED':
      case 'success':
        return 'success';
      case 'PENDING':
      case 'warning':
        return 'warning';
      case 'OVERDUE':
      case 'SUSPENDED':
      case 'CANCELLED':
      case 'FAILED':
      case 'error':
      case 'danger':
        return 'danger';
      case 'info':
        return 'info';
      case 'brand':
        return 'brand';
      default:
        return 'neutral';
    }
  })();

  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    neutral: 'bg-secondary text-secondaryText border-border',
    brand: 'bg-primary/10 text-primary border-primary/20',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    brand: 'bg-primary',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-bold gap-1',
    md: 'px-2.5 py-0.5 text-[11px] font-bold gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[normalizedVariant]} ${sizeStyles[size]} uppercase tracking-wider select-none font-sans ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[normalizedVariant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

