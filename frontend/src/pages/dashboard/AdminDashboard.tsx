import React, { useMemo } from 'react';
import {
  DollarSign,
  Users,
  CreditCard,
  FileText,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Download,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { Customer } from '../../types/customer';
import { Ticket } from '../../types/ticket';
import { Subscription } from '../../types/subscription';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Load all live data from localStorage APIs
  const invoices = useMemo(() => getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []), []);
  const customers = useMemo(() => getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []), []);
  const tickets = useMemo(() => getItem<Ticket[]>(STORAGE_KEYS.TICKETS, []), []);
  const subscriptions = useMemo(() => getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []), []);

  // Live KPI calculations
  const totalMRR = customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const totalRevenue = invoices.reduce((sum, inv) => (inv.status === 'Paid' ? sum + inv.amount : sum), 0);
  const activeCustomers = customers.filter((c) => c.status === 'Verified' || c.status === 'Active').length;
  const pendingInvoices = invoices.filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue').length;
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'Active'
  ).length;
  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const totalCustomers = customers.length;

  // Recent data slices
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.joinedDate || 0).getTime() - new Date(a.joinedDate || 0).getTime())
    .slice(0, 5);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate || 0).getTime() - new Date(a.issueDate || 0).getTime())
    .slice(0, 5);

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime())
    .slice(0, 4);

  const statCards = [
    {
      label: 'Total MRR',
      value: formatCurrency(totalMRR),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      change: '+12.4%',
      changePositive: true,
      action: () => navigate('/admin/reports'),
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      change: 'All time',
      changePositive: true,
      action: () => navigate('/admin/invoices'),
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toString(),
      icon: Users,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      change: `${activeCustomers} active`,
      changePositive: true,
      action: () => navigate('/admin/customers'),
    },
    {
      label: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      change: `${subscriptions.length} total`,
      changePositive: true,
      action: () => navigate('/admin/subscriptions'),
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices.toString(),
      icon: FileText,
      color: pendingInvoices > 0 ? 'text-amber-500' : 'text-slate-400',
      bg: pendingInvoices > 0 ? 'bg-amber-500/10' : 'bg-slate-500/10',
      change: `${invoices.length} total`,
      changePositive: pendingInvoices === 0,
      action: () => navigate('/admin/invoices'),
    },
    {
      label: 'Open Tickets',
      value: openTickets.toString(),
      icon: Headphones,
      color: openTickets > 0 ? 'text-rose-500' : 'text-slate-400',
      bg: openTickets > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10',
      change: `${tickets.length} total`,
      changePositive: openTickets === 0,
      action: () => navigate('/admin/support'),
    },
  ];

  const getTicketStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'In Progress':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />;
      case 'Resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Cancelled':
        return <XCircle className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-mutedText" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-heading">Admin Dashboard</h1>
            <Badge variant="brand">Admin Mode</Badge>
          </div>
          <p className="text-xs text-secondaryText mt-1">
            Real-time platform overview — subscribers, billing, revenue & support metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => navigate('/admin/reports')}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/admin/customers')}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.action}
              className="text-left w-full group"
            >
              <Card className="p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-mutedText group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-extrabold text-heading mt-0.5">{card.value}</p>
                  <p className={`text-[11px] font-bold mt-1 ${card.changePositive ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {card.change}
                  </p>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-heading mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Customer', icon: Users, path: '/admin/customers', color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Create Plan', icon: Layers, path: '/admin/plans', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'View Tickets', icon: Headphones, path: '/admin/support', color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Run Reports', icon: BarChart2, path: '/admin/reports', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 cursor-pointer group"
              >
                <div className={`p-2.5 rounded-xl ${action.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-bold text-heading text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity — 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customers */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-heading">Recent Customers</h2>
            <button
              onClick={() => navigate('/admin/customers')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentCustomers.length === 0 ? (
            <p className="text-xs text-mutedText text-center py-6">No customers yet</p>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-heading truncate">{c.name}</p>
                    <p className="text-[10px] text-mutedText truncate">{c.email}</p>
                  </div>
                  <Badge variant={c.status === 'Verified' || c.status === 'Active' ? 'success' : 'warning'}>
                    {c.subscriptionPlan || 'No Plan'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-heading">Recent Invoices</h2>
            <button
              onClick={() => navigate('/admin/invoices')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-xs text-mutedText text-center py-6">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-heading truncate">{inv.customerName || 'Unknown'}</p>
                    <p className="text-[10px] text-mutedText">{inv.issueDate}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-extrabold text-heading">{formatCurrency(inv.amount)}</p>
                    <Badge
                      variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Support Tickets */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-heading">Support Tickets</h2>
            <button
              onClick={() => navigate('/admin/support')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentTickets.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-mutedText font-medium">No open tickets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/support')}>
                  <div className="mt-0.5">{getTicketStatusIcon(t.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-heading truncate">{t.subject}</p>
                    <p className="text-[10px] text-mutedText truncate">{t.customerName || t.customerEmail}</p>
                  </div>
                  <Badge variant="neutral">{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
