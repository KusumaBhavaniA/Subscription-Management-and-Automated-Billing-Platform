import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  shortcutBadge?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  shortcutBadge,
  size = 'md',
  fullWidth = true,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const defaultShortcut = isMac ? '⌘K' : 'Ctrl+K';
  const badge = shortcutBadge ?? defaultShortcut;

  const sizeClasses = {
    sm: 'h-8 text-xs pl-8 pr-8',
    md: 'h-10 text-xs sm:text-sm pl-9 pr-9',
    lg: 'h-11 text-sm pl-10 pr-10',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-4.5 h-4.5 left-3.5',
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-64 sm:w-80'}`}>
      <Search
        className={`absolute top-1/2 -translate-y-1/2 text-mutedText pointer-events-none transition-colors ${iconSizes[size]}`}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl bg-input border border-border text-primaryText placeholder:text-mutedText transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium ${sizeClasses[size]} ${className}`}
        {...props}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-mutedText hover:text-primaryText hover:bg-secondary transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : badge ? (
        <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-secondary text-secondaryText border border-border pointer-events-none select-none">
          {badge}
        </kbd>
      ) : null}
    </div>
  );
};
