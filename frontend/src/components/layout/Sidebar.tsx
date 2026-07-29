import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  FileText,
  DollarSign,
  PieChart,
  BarChart2,
  Settings,
  User,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BPLogo } from '../common/BPLogo';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';

export interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { requestNavigation } = useUnsavedChanges();

  if (!user) return null;

  const isAdmin = user.role === 'Admin';
  const rolePrefix = isAdmin ? '/admin' : '/customer';

  const adminNavItems = [
    { label: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Plans', path: '/admin/plans', icon: Layers },
    { label: 'Subscriptions', path: `${rolePrefix}/subscriptions`, icon: CreditCard },
    { label: 'Invoices', path: `${rolePrefix}/invoices`, icon: FileText },
    { label: 'Payments', path: `${rolePrefix}/payments`, icon: DollarSign },
    { label: 'Analytics', path: '/admin/analytics', icon: PieChart },
    { label: 'Reports', path: `${rolePrefix}/reports`, icon: BarChart2 },
    { label: 'Settings', path: `${rolePrefix}/settings`, icon: Settings },
    { label: 'Profile', path: `${rolePrefix}/profile`, icon: User },
  ];

  const customerNavItems = [
    { label: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
    { label: 'My Subscription', path: `${rolePrefix}/subscriptions`, icon: CreditCard },
    { label: 'My Invoices', path: `${rolePrefix}/invoices`, icon: FileText },
    { label: 'Payments', path: `${rolePrefix}/payments`, icon: DollarSign },
    { label: 'Reports', path: `${rolePrefix}/reports`, icon: BarChart2 },
    { label: 'Profile', path: `${rolePrefix}/profile`, icon: User },
    { label: 'Settings', path: `${rolePrefix}/settings`, icon: Settings },
    { label: 'Support', path: '/customer/support', icon: HelpCircle },
  ];

  const navItems = isAdmin ? adminNavItems : customerNavItems;

  const handleLogout = () => {
    onCloseMobile();
    requestNavigation(() => {
      logout();
      navigate('/login');
    });
  };

  const handleNavClick = (path: string) => {
    onCloseMobile();
    if (location.pathname === path) return;
    requestNavigation(() => {
      navigate(path);
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border text-primaryText transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border shrink-0">
        <button
          onClick={() => handleNavClick(`${rolePrefix}/dashboard`)}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <BPLogo size="md" className="group-hover:scale-105 transition-transform" />
          <div>
            <span className="font-extrabold text-base text-heading tracking-tight flex items-center gap-1.5">
              Billing Platform
            </span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block -mt-0.5">
              {isAdmin ? 'Admin Console' : 'Customer Workspace'}
            </span>
          </div>
        </button>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-mutedText hover:text-primaryText hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-mutedText uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-current" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-danger hover:bg-danger-bg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 max-w-full"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
