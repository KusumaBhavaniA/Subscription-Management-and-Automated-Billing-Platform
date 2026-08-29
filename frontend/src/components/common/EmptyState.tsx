import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-border bg-card/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-mutedText mb-4 border border-border">
        {Icon ? (
          React.isValidElement(Icon) ? (
            Icon
          ) : (
            React.createElement(Icon as React.ComponentType<{ className?: string }>, {
              className: 'w-6 h-6 text-secondaryText',
            })
          )
        ) : (
          <FolderOpen className="w-6 h-6 text-secondaryText" />
        )}
      </div>

      <h3 className="text-sm sm:text-base font-bold text-heading tracking-tight">{title}</h3>
      <p className="text-xs text-secondaryText mt-1 max-w-sm font-medium leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            leftIcon={actionIcon}
            className="shadow-sm"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
