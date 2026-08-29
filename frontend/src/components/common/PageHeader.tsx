import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  badge?: string;
  badgeVariant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'brand',
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              {React.isValidElement(Icon)
                ? Icon
                : React.createElement(Icon as React.ComponentType<{ className?: string }>, {
                    className: 'w-5 h-5',
                  })}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-extrabold text-heading tracking-tight">
            {title}
          </h1>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {subtitle && (
          <p className="text-xs text-secondaryText mt-1 font-medium leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">{children}</div>
      )}
    </div>
  );
};
