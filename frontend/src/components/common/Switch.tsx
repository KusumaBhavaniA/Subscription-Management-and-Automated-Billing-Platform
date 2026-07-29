import React from 'react';
import { motion } from 'framer-motion';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-2">
      {(label || description) && (
        <div className="pr-4 select-none">
          {label && (
            <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
        style={{
          backgroundColor: checked ? 'var(--primary)' : 'var(--secondary)',
        }}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0"
          style={{
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0rem)',
          }}
        />
      </button>
    </label>
  );
};
