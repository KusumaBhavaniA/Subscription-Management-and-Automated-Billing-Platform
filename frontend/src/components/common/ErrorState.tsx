import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'Something went wrong while retrieving the information. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-500/5 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-sm sm:text-base font-bold text-heading tracking-tight">{title}</h3>
      <p className="text-xs text-secondaryText mt-1 max-w-sm font-medium leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
