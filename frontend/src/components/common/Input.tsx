import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      prefixText,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-secondaryText"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center rounded-lg shadow-sm">
          {prefixText && (
            <span className="inline-flex items-center px-3 py-2.5 rounded-l-lg border border-r-0 border-border bg-secondary text-secondaryText text-sm font-semibold select-none">
              {prefixText}
            </span>
          )}
          {leftIcon && (
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-mutedText">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-input border text-primaryText text-sm rounded-lg transition-all duration-150 placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ${
              prefixText ? 'rounded-l-none' : ''
            } ${leftIcon ? 'pl-10' : 'pl-3.5'} ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-danger focus:ring-danger/25 focus:border-danger'
                : 'border-border'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 inset-y-0 flex items-center text-mutedText">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-semibold text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-mutedText font-medium">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
