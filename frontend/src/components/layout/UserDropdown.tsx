import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Settings, LogOut, ShieldCheck, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { requestNavigation } = useUnsavedChanges();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const isAdmin = user.role === 'Admin';
  const rolePrefix = isAdmin ? '/admin' : '/customer';

  const handleLogout = () => {
    setIsOpen(false);
    requestNavigation(() => {
      logout();
      navigate('/login');
    });
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    requestNavigation(() => {
      navigate(path);
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-secondary transition-colors focus:outline-none cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <Avatar name={user.fullName} size="sm" src={user.profilePicture} status="online" />
        <div className="hidden md:block text-left">
          <div className="text-xs font-bold text-heading truncate max-w-[120px]">
            {user.fullName}
          </div>
          <div className="text-[10px] font-semibold text-secondaryText uppercase tracking-wider flex items-center gap-1">
            {isAdmin ? (
              <span className="text-primary font-bold">Admin</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Customer</span>
            )}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-mutedText hidden sm:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-xl z-50 overflow-hidden text-primaryText"
          >
            {/* Top Section */}
            <div className="px-4 py-3.5 border-b border-border bg-secondary/50 space-y-2">
              <div>
                <p className="text-xs font-extrabold text-heading truncate">{user.fullName}</p>
                <p className="text-[11px] font-medium text-secondaryText truncate">{user.email}</p>
              </div>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-1.5 text-[10px]">
                <div>
                  <span className="text-mutedText font-bold block uppercase tracking-wider">ID</span>
                  <span className="font-mono font-bold text-heading">{user.customerId || (isAdmin ? 'ADM-01' : 'CUS-01')}</span>
                </div>
                <div>
                  <span className="text-mutedText font-bold block uppercase tracking-wider">Role</span>
                  <Badge variant={isAdmin ? 'brand' : 'success'} size="sm">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => handleNavigate(`${rolePrefix}/profile`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-secondaryText hover:text-heading hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-secondaryText" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => handleNavigate(`${rolePrefix}/settings`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-secondaryText hover:text-heading hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-secondaryText" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleNavigate(isAdmin ? `/admin/support` : `/customer/support`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-secondaryText hover:text-heading hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-secondaryText" />
                <span>Help & Support</span>
              </button>
            </div>

            <div className="p-1.5 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

