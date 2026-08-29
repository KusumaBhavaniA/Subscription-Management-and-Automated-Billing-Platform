import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon, Loader2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface IconButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon | React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  isLoading?: boolean;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      variant = 'ghost',
      size = 'md',
      tooltip,
      isLoading = false,
      disabled,
      className = '',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none shrink-0';

    const variantStyles = {
      primary:
        'bg-primary hover:bg-primary-hover text-white shadow-xs border border-primary/20',
      secondary:
        'bg-surface hover:bg-secondary text-primaryText border border-border shadow-2xs',
      outline:
        'border border-border text-secondaryText hover:text-heading hover:bg-secondary/70',
      ghost:
        'text-secondaryText hover:text-heading hover:bg-secondary',
      danger:
        'text-danger hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900',
    };

    const sizeStyles = {
      sm: 'w-7 h-7 p-1 text-xs',
      md: 'w-8 h-8 p-1.5 text-sm',
      lg: 'w-10 h-10 p-2 text-base',
    };

    const button = (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : React.isValidElement(Icon) ? (
          Icon
        ) : (
          React.createElement(Icon as React.ComponentType<{ className?: string }>, {
            className: 'w-4 h-4',
          })
        )}
      </motion.button>
    );

    if (tooltip) {
      return <Tooltip content={tooltip}>{button}</Tooltip>;
    }

    return button;
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;

