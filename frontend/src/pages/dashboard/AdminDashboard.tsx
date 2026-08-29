import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  FileText,
  Headphones,
  Download,
  ArrowUpRight,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  BarChart2,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Avatar } from '../../components/common/Avatar';
import { billingApi } from '../../services/api/billingApi';
import { formatCurrency } from '../../utils/formatters';
import { PaymentCalendar } from '../../components/calendar/PaymentCalendar';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    activeSubscriptions: 0,
    totalMRR: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    openTickets: 0,
    recentCustomers: [] as any[],
    recentInvoices: [] as any[],
    recentTickets: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await billingApi.getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const {
    totalMRR,
    totalRevenue,
    activeCustomers,
    pendingInvoices,
    activeSubscriptions,
    openTickets,
    totalCustomers,
    recentCustomers,
    recentInvoices,
    recentTickets,
  } = stats;

  const statCards = [
    {
      label: 'Monthly Recurring Revenue',
      value: formatCurrency(totalMRR),
      icon: TrendingUp,
      colorScheme: 'emerald' as const,
      supportingText: totalMRR > 0 ? 'Active subscriptions MRR' : '₹0.00 / month',
      trendText: 'Recurring',
      trendPositive: true,
      action: () => navigate('/admin/reports'),
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      colorScheme: 'blue' as const,
      supportingText: 'Cumulative lifetime collections',
      trendText: 'All-Time',
      trendPositive: true,
      action: () => navigate('/admin/invoices'),
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toString(),
      icon: Users,
      colorScheme: 'indigo' as const,
      supportingText: `${activeCustomers} active accounts in directory`,
      trendText: `${activeCustomers} Active`,
      trendPositive: true,
      action: () => navigate('/admin/customers'),
    },
    {
      label: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      colorScheme: 'cyan' as const,
      supportingText: `${activeSubscriptions} total active subscriber plans`,
      trendText: 'Live Plans',
      trendPositive: true,
      action: () => navigate('/admin/subscriptions'),
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices.toString(),
      icon: FileText,
      colorScheme: pendingInvoices > 0 ? ('amber' as const) : ('blue' as const),
      supportingText:
        pendingInvoices > 0
          ? `${pendingInvoices} invoice(s) awaiting payment`
          : 'All invoices settled',
      trendText: pendingInvoices > 0 ? `${pendingInvoices} Unpaid` : 'Settled',
      trendPositive: pendingInvoices === 0,
      action: () => navigate('/admin/invoices'),
    },
    {
      label: 'Open Support Tickets',
      value: openTickets.toString(),
      icon: Headphones,
      colorScheme: openTickets > 0 ? ('rose' as const) : ('emerald' as const),
      supportingText:
        openTickets > 0
          ? `${openTickets} pending customer inquiries`
          : 'Zero open inquiries',
      trendText: openTickets > 0 ? 'Action Req' : 'Clear',
      trendPositive: openTickets === 0,
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
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time platform overview — subscribers, billing, revenue & support metrics."
        badge="Live Operations"
      >
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => navigate('/admin/reports')}
        >
          Export Report
        </Button>
      </PageHeader>

      <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-heading">Good morning, Administrator</h2>
          <p className="text-xs text-secondaryText font-medium mt-0.5">
            Here's what's happening with your subscription business today.
          </p>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-bold text-mutedText px-3 py-1 bg-card rounded-lg border border-border">
          Current Billing Cycle (2026)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            colorScheme={card.colorScheme}
            supportingText={card.supportingText}
            trendText={card.trendText}
            trendPositive={card.trendPositive}
            onClick={card.action}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-heading">Revenue & MRR Distribution</h2>
              <p className="text-xs text-secondaryText">
                Real-time revenue breakdown across subscriptions and billed invoices.
              </p>
            </div>
            <Badge variant="success" dot>
              Audit Verified
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-secondary/60 border border-border space-y-2">
              <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
                Monthly Recurring (MRR)
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalMRR)}
              </p>
              <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalRevenue > 0
                        ? Math.min(100, Math.round((totalMRR / totalRevenue) * 100))
                        : 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-mutedText">
                Contributes {totalRevenue > 0 ? Math.round((totalMRR / totalRevenue) * 100) : 0}% of all-time platform volume
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/60 border border-border space-y-2">
              <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
                All-Time Cumulative Collections
              </span>
              <p className="text-2xl font-black text-heading">{formatCurrency(totalRevenue)}</p>
              <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-mutedText">
                Total gross settled invoices and recurring charges
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-heading mb-2 uppercase tracking-wider">
              Active Subscriber Allocation
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] font-bold text-mutedText uppercase block">Starter Tier</span>
                <span className="text-sm font-extrabold text-heading">₹1,999/mo</span>
              </div>
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
                <span className="text-[10px] font-bold text-primary uppercase block">Pro Business</span>
                <span className="text-sm font-extrabold text-primary">₹4,999/mo</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] font-bold text-mutedText uppercase block">Enterprise</span>
                <span className="text-sm font-extrabold text-heading">₹14,999/mo</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="pb-2 border-b border-border">
            <h2 className="text-sm font-bold text-heading">Quick Actions</h2>
            <p className="text-xs text-secondaryText">Direct access to core administrative functions.</p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                label: 'Manage Plans & Pricing',
                desc: 'Configure SaaS pricing tiers & specifications',
                icon: Layers,
                path: '/admin/plans',
                colorScheme: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
              },
              {
                label: 'Customer Directory',
                desc: 'Inspect subscribers, suspensions, recycle bin',
                icon: Users,
                path: '/admin/customers',
                colorScheme: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
              },
              {
                label: 'Support Operations',
                desc: 'Respond to tickets and restoration requests',
                icon: Headphones,
                path: '/admin/support',
                colorScheme: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
              },
              {
                label: 'Export Reports (PDF/CSV)',
                desc: 'Audit-ready financial and subscriber logs',
                icon: BarChart2,
                path: '/admin/reports',
                colorScheme: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-secondary/60 transition-all text-left group cursor-pointer"
                >
                  <div className={`p-2 rounded-xl ${action.colorScheme} group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-heading truncate">{action.label}</p>
                    <p className="text-[10px] text-secondaryText truncate font-medium">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-mutedText group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <PaymentCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h2 className="text-sm font-bold text-heading">Recent Customers</h2>
              <button
                onClick={() => navigate('/admin/customers')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Customers Yet"
                description="New customer registrations will appear here in real-time."
              />
            ) : (
              <div className="space-y-2">
                {recentCustomers.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/customers/${c.id}`)}
                  >
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-heading truncate">{c.name}</p>
                      <p className="text-[10px] text-mutedText truncate">{c.email}</p>
                    </div>
                    <Badge variant={c.status === 'Verified' || c.status === 'Active' ? 'ACTIVE' : 'PENDING'}>
                      {c.subscriptionPlan || 'No Plan'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h2 className="text-sm font-bold text-heading">Recent Invoices</h2>
              <button
                onClick={() => navigate('/admin/invoices')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Invoices Yet"
                description="Issued billing statements and invoices will appear here."
              />
            ) : (
              <div className="space-y-2">
                {recentInvoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-heading truncate">{inv.customerName || 'Unknown'}</p>
                      <p className="text-[10px] text-mutedText font-mono">{inv.invoiceNumber || inv.issueDate}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-extrabold text-heading">{formatCurrency(inv.amount)}</p>
                      <Badge
                        variant={inv.status === 'Paid' ? 'PAID' : inv.status === 'Overdue' ? 'OVERDUE' : 'PENDING'}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h2 className="text-sm font-bold text-heading">Support Tickets</h2>
              <button
                onClick={() => navigate('/admin/support')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentTickets.length === 0 ? (
              <EmptyState
                icon={Headphones}
                title="Inbox Zero"
                description="All support inquiries are resolved."
              />
            ) : (
              <div className="space-y-2">
                {recentTickets.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/support')}
                  >
                    <div className="mt-0.5 shrink-0">{getTicketStatusIcon(t.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-heading truncate">{t.subject}</p>
                      <p className="text-[10px] text-mutedText truncate">{t.customerName || t.customerEmail}</p>
                    </div>
                    <Badge variant={t.status === 'Resolved' ? 'RESOLVED' : t.status === 'Open' ? 'PENDING' : 'neutral'}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
