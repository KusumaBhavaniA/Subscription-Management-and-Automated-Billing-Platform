import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Settings, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center shadow-md">
          {getInitials(user.fullName)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[120px]">
            {user.fullName}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
            {isAdmin ? <ShieldCheck className="w-3 h-3 text-primary" /> : <UserCheck className="w-3 h-3 text-emerald-500" />}
            {user.role}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] shadow-2xl z-[100] overflow-hidden text-[#0F172A] dark:text-[#F8FAFC]"
          >
            {/* Top Section */}
            <div className="px-4 py-3.5 border-b border-[#E2E8F0] dark:border-[#334155] bg-slate-50 dark:bg-[#1E293B] space-y-2">
              <div>
                <p className="text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC] truncate">{user.fullName}</p>
                <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] truncate">{user.email}</p>
              </div>

              <div className="pt-1.5 border-t border-[#E2E8F0] dark:border-[#334155]/60 grid grid-cols-2 gap-1.5 text-[10px]">
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-bold block uppercase tracking-wider">Customer ID</span>
                  <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{user.customerId || 'CUS-2026-01'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-bold block uppercase tracking-wider">Current Plan</span>
                  <span className="font-bold text-[#2563EB] dark:text-blue-400">{user.currentPlan || (isAdmin ? 'Admin Portal' : 'Pro Plan')}</span>
                </div>
                <div className="col-span-2 pt-0.5 flex items-center justify-between">
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">Account Status</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => handleNavigate(`${rolePrefix}/profile`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                My Profile
              </button>

              <button
                onClick={() => handleNavigate(`${rolePrefix}/settings`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                Settings
              </button>

              <button
                onClick={() => handleNavigate(isAdmin ? `/admin/settings` : `/customer/support`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                Help & Support
              </button>
            </div>

            <div className="p-1.5 border-t border-[#E2E8F0] dark:border-[#334155]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
