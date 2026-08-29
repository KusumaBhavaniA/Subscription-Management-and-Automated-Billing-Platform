import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon | React.ReactNode;
  supportingText?: string;
  trendText?: string;
  trendPositive?: boolean;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  supportingText,
  trendText,
  trendPositive = true,
  colorScheme = 'blue',
  onClick,
  className = '',
}) => {
  const schemeStyles = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  const cardContent = (
    <Card
      className={`p-5 flex flex-col justify-between h-full transition-all duration-150 ${
        onClick ? 'hover:border-primary/40 hover:shadow-sm cursor-pointer group' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-xl border shrink-0 ${schemeStyles[colorScheme]}`}>
            {React.isValidElement(Icon)
              ? Icon
              : React.createElement(Icon as React.ComponentType<{ className?: string }>, {
                  className: 'w-5 h-5',
                })}
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {trendText && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                trendPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {trendPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trendText}
            </span>
          )}
          {onClick && (
            <ArrowUpRight className="w-4 h-4 text-mutedText group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-heading tracking-tight">
          {value}
        </p>
        {supportingText && (
          <p className="text-[11px] font-medium text-secondaryText pt-0.5 truncate">
            {supportingText}
          </p>
        )}
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full focus:outline-none">
        {cardContent}
      </button>
    );
  }

  return cardContent;
};
