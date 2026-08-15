import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
      type,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const effectiveRightIcon = rightIcon || (isPassword ? (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(!showPassword)}
        className="text-mutedText hover:text-primaryText focus:outline-none p-1 transition-colors cursor-pointer"
        title={showPassword ? 'Hide password' : 'Show password'}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : null);

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
            type={actualType}
            className={`w-full bg-input border text-primaryText text-sm rounded-lg transition-all duration-150 placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ${
              prefixText ? 'rounded-l-none' : ''
            } ${leftIcon ? 'pl-10' : 'pl-3.5'} ${effectiveRightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-danger focus:ring-danger/25 focus:border-danger'
                : 'border-border'
            } ${className}`}
            {...props}
          />
          {effectiveRightIcon && (
            <div className="absolute right-3 inset-y-0 flex items-center text-mutedText">
              {effectiveRightIcon}
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
