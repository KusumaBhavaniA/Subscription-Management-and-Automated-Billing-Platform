import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  path: string;
  description: string;
  iconName: string;
}

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin';
  const rolePrefix = isAdmin ? '/admin' : '/customer';

  const searchablePages: SearchResult[] = useMemo(() => {
    const commonPages: SearchResult[] = [
      {
        id: 'dashboard',
        title: 'Dashboard Overview',
        category: 'Navigation',
        path: `${rolePrefix}/dashboard`,
        description: 'View real-time SaaS metrics, invoices & subscriptions',
        iconName: 'LayoutDashboard',
      },
      {
        id: 'subscriptions',
        title: isAdmin ? 'All Subscriptions' : 'My Subscription',
        category: 'Billing',
        path: `${rolePrefix}/subscriptions`,
        description: 'Manage active subscriptions, renewals and plans',
        iconName: 'CreditCard',
      },
      {
        id: 'invoices',
        title: isAdmin ? 'All Invoices' : 'My Invoices',
        category: 'Billing',
        path: `${rolePrefix}/invoices`,
        description: 'View, generate and download PDF billing statements',
        iconName: 'FileText',
      },
      {
        id: 'payments',
        title: 'Payment History',
        category: 'Billing',
        path: `${rolePrefix}/payments`,
        description: 'Transaction logs, payment gateways and receipts',
        iconName: 'DollarSign',
      },
      {
        id: 'reports',
        title: 'Reports & Export',
        category: 'Analytics',
        path: `${rolePrefix}/reports`,
        description: 'Financial summaries, tax statements and audit logs',
        iconName: 'BarChart2',
      },
      {
        id: 'settings',
        title: 'Workspace Settings',
        category: 'Preferences',
        path: `${rolePrefix}/settings`,
        description: 'Currencies, timezone, date formats & notification toggles',
        iconName: 'Settings',
      },
      {
        id: 'profile',
        title: 'Account Profile',
        category: 'Account',
        path: `${rolePrefix}/profile`,
        description: 'Personal details, security settings & password update',
        iconName: 'User',
      },
    ];

    if (isAdmin) {
      commonPages.push(
        {
          id: 'customers',
          title: 'Customer Directory',
          category: 'Management',
          path: '/admin/customers',
          description: 'View, add, edit & manage customer accounts',
          iconName: 'Users',
        },
        {
          id: 'plans',
          title: 'Subscription Plans',
          category: 'Management',
          path: '/admin/plans',
          description: 'Manage pricing tiers, feature lists and monthly rates',
          iconName: 'Layers',
        },
        {
          id: 'analytics',
          title: 'Financial Analytics',
          category: 'Analytics',
          path: '/admin/analytics',
          description: 'Deep dive into MRR, Churn rate, LTV and growth',
          iconName: 'PieChart',
        }
      );
    } else {
      commonPages.push({
        id: 'support',
        title: 'Customer Support',
        category: 'Help',
        path: '/customer/support',
        description: 'Contact support, open tickets and view FAQs',
        iconName: 'HelpCircle',
      });
    }

    return commonPages;
  }, [isAdmin, rolePrefix]);

  const filteredResults = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return searchablePages;

    return searchablePages.filter(
      (item) =>
        item.title.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery) ||
        item.description.toLowerCase().includes(cleanQuery) ||
        item.id.toLowerCase().includes(cleanQuery)
    );
  }, [query, searchablePages]);

  const selectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.path);
  };

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    filteredResults,
    selectResult,
  };
};
