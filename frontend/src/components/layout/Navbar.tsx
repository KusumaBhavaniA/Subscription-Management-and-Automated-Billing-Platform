import React, { useState } from 'react';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { NotificationDropdown } from './NotificationDropdown';
import { UserDropdown } from './UserDropdown';
import { SearchModal } from './SearchModal';

export interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 border-b border-border bg-surface/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-secondaryText hover:bg-secondary hover:text-primaryText transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-input border border-border text-mutedText hover:text-primaryText hover:border-primary transition-all text-xs w-64 lg:w-80 group cursor-pointer"
          >
            <Search className="w-4 h-4 text-mutedText group-hover:text-primary transition-colors" />
            <span className="flex-1 text-left font-medium">Search pages, invoices...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-secondary text-secondaryText">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-secondaryText hover:bg-secondary hover:text-primaryText transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2 rounded-xl text-secondaryText hover:bg-secondary hover:text-primaryText transition-colors focus:outline-none group cursor-pointer"
            title={`Current Theme: ${theme.toUpperCase()} (Click to toggle Light / Dark)`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}

            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-card text-primaryText text-[10px] font-bold rounded-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
              Toggle Light / Dark
            </span>
          </button>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          <div className="h-5 w-[1px] bg-border mx-1" />

          {/* User Profile Dropdown */}
          <UserDropdown />
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
