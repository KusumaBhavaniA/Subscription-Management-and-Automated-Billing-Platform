import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold uppercase tracking-wider text-secondaryText"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-input border text-primaryText text-sm font-semibold rounded-lg transition-colors px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ${
            error ? 'border-danger' : 'border-border'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dropdown text-primaryText">
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs font-semibold text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-mutedText font-medium">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
