import React, { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'Admin';
  const rolePrefix = isAdmin ? '/admin' : '/customer';

  const adminNavGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
        { label: 'Analytics', path: '/admin/analytics', icon: PieChart },
        { label: 'Reports', path: `${rolePrefix}/reports`, icon: BarChart2 },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Plans', path: '/admin/plans', icon: Layers },
        { label: 'Subscriptions', path: `${rolePrefix}/subscriptions`, icon: CreditCard },
      ],
    },
    {
      title: 'Finance & Billing',
      items: [
        { label: 'Invoices', path: `${rolePrefix}/invoices`, icon: FileText },
        { label: 'Payments', path: `${rolePrefix}/payments`, icon: DollarSign },
      ],
    },
    {
      title: 'Support & System',
      items: [
        { label: 'Support', path: '/admin/support', icon: HelpCircle },
        { label: 'Settings', path: `${rolePrefix}/settings`, icon: Settings },
        { label: 'Profile', path: `${rolePrefix}/profile`, icon: User },
      ],
    },
  ];

  const customerNavGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: `${rolePrefix}/dashboard`, icon: LayoutDashboard },
        { label: 'View Plans', path: '/customer/plans', icon: Layers },
      ],
    },
    {
      title: 'Subscriptions & Billing',
      items: [
        { label: 'My Subscription', path: `${rolePrefix}/subscriptions`, icon: CreditCard },
        { label: 'My Invoices', path: `${rolePrefix}/invoices`, icon: FileText },
        { label: 'Payments', path: `${rolePrefix}/payments`, icon: DollarSign },
        { label: 'Billing Summary', path: `${rolePrefix}/billing-summary`, icon: BarChart2 },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Support', path: '/customer/support', icon: HelpCircle },
        { label: 'Settings', path: `${rolePrefix}/settings`, icon: Settings },
        { label: 'Profile', path: `${rolePrefix}/profile`, icon: User },
      ],
    },
  ];

  const navGroups = isAdmin ? adminNavGroups : customerNavGroups;

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

  const renderSidebar = (collapsed: boolean, isMobile: boolean) => (
    <div className="flex flex-col h-full bg-surface border-r border-border text-primaryText transition-colors duration-200 select-none">
      {/* Brand Header */}
      <div className={`h-16 px-4 flex items-center justify-between border-b border-border shrink-0 ${collapsed ? 'px-2 justify-center' : ''}`}>
        <button
          onClick={() => handleNavClick(`${rolePrefix}/dashboard`)}
          className="flex items-center gap-3 group text-left cursor-pointer overflow-hidden"
          title="NexFlow Admin Console"
        >
          <BPLogo size={collapsed ? 'sm' : 'md'} className="group-hover:scale-105 transition-transform" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-heading tracking-tight">
                  NexFlow
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block -mt-0.5">
                {isAdmin ? 'Admin Console' : 'Customer Portal'}
              </span>
            </div>
          )}
        </button>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-mutedText hover:text-primaryText hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          !collapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-mutedText hover:text-primaryText hover:bg-secondary transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-extrabold text-mutedText uppercase tracking-wider">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    collapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-secondaryText hover:text-heading hover:bg-secondary/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-secondaryText'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Section: Expand toggle (if collapsed) & Logout */}
      <div className="p-3 border-t border-border shrink-0 space-y-1">
        {collapsed && !isMobile && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-secondaryText hover:text-primaryText hover:bg-secondary transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 shrink-0 z-40 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebar(isCollapsed, false)}
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
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 max-w-full z-10"
            >
              {renderSidebar(false, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};