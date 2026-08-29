import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-hover text-white shadow-sm border border-primary/20 focus:ring-primary',
    secondary:
      'bg-surface hover:bg-secondary text-primaryText border border-border shadow-xs focus:ring-primary',
    outline:
      'border border-border text-secondaryText hover:text-primaryText hover:bg-secondary/60 focus:ring-primary',
    ghost:
      'text-secondaryText hover:text-primaryText hover:bg-secondary focus:ring-primary',
    danger:
      'bg-danger hover:opacity-95 text-white shadow-xs focus:ring-danger border border-danger/30',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-bold',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 font-bold',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5 font-extrabold',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.005 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && (
            <span className="inline-flex shrink-0">
              {React.isValidElement(leftIcon)
                ? leftIcon
                : React.createElement(leftIcon as unknown as React.ComponentType<{ className?: string }>, {
                    className: 'w-4 h-4',
                  })}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="inline-flex shrink-0">
              {React.isValidElement(rightIcon)
                ? rightIcon
                : React.createElement(rightIcon as unknown as React.ComponentType<{ className?: string }>, {
                    className: 'w-4 h-4',
                  })}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
};
