import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Download,
  Sparkles,
  X,
  ShieldCheck,
  Calendar,
  BookmarkCheck,
  Zap,
  Users,
  HardDrive,
  Code2,
  Headphones,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { Subscription, SubscriptionStatus } from '../../types/subscription';
import { Plan } from '../../types/plan';
import { subscriptionManagementApi } from '../../services/api/subscriptionManagementApi';
import { planApi } from '../../services/api/planApi';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);

  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (user?.email) {
        const sub = await subscriptionManagementApi.getSubscriptionByEmail(user.email);
        setActiveSub(sub);

        if (sub) {
          const plans = await planApi.getPlans();
          const p = plans.find((item) => item.name === sub.planName);
          if (p) setPlanDetails(p);
        }
      }

      const allInvoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
      setInvoices(
        allInvoices.filter(
          (inv) => inv.customerEmail.toLowerCase() === (user?.email || '').toLowerCase()
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const customerName = user?.fullName || 'Customer';
  const accountStatus = user?.status || 'Verified';

  const getSubStatusBadge = (st?: SubscriptionStatus) => {
    switch (st) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="neutral">Inactive</Badge>;
      case 'Expired':
        return <Badge variant="warning">Expired</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">No Subscription</Badge>;
    }
  };

  const hasActiveSubscription =
    activeSub &&
    activeSub.planName !== 'None' &&
    activeSub.status !== 'Cancelled' &&
    activeSub.status !== 'Inactive';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* WELCOME CARD */}
      <AnimatePresence>
        {showWelcomeCard && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-card border border-border text-primaryText shadow-sm space-y-6"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Verified Customer Workspace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-heading">
                  Welcome Back, {customerName} 👋
                </h2>
                <p className="text-sm text-secondaryText font-medium">
                  Your billing workspace is synchronized with backend APIs in real time.
                </p>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary p-4 rounded-xl border border-border shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Current Plan
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-heading">
                    <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                    <span>{hasActiveSubscription ? activeSub?.planName : 'None'}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Account Status
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-success">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    <span>{accountStatus}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Subscription
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-primary">
                    {getSubStatusBadge(activeSub?.status)}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Next Renewal
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-primary font-mono">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{hasActiveSubscription && activeSub?.nextBillingDate ? formatDate(activeSub.nextBillingDate) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWelcomeCard(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-mutedText hover:text-primaryText hover:bg-secondary transition-colors"
              title="Dismiss Welcome Card"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Customer Dashboard</h1>
          <p className="text-xs text-secondaryText mt-1">
            Real-time backend subscription tracking and billing statements.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/customer/subscriptions')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          My Subscription
        </Button>
      </div>

      {/* MY SUBSCRIPTION SECTION */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-xs text-secondaryText mt-3 font-semibold">Fetching subscription from backend...</p>
        </Card>
      ) : !hasActiveSubscription ? (
        /* FRIENDLY EMPTY STATE WHEN NO SUBSCRIPTION IS ASSIGNED */
        <Card className="p-8 text-center space-y-4 border border-dashed border-border bg-card">
          <AlertCircle className="w-12 h-12 text-mutedText mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-heading">You don't have an active subscription yet.</h3>
            <p className="text-xs text-secondaryText max-w-md mx-auto">
              No plan has been assigned to your account by the administrator. Browse our SaaS tiers to select a plan.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={() => navigate('/customer/plans')}
          >
            View Available Plans
          </Button>
        </Card>
      ) : (
        /* ACTIVE SUBSCRIPTION DETAILS CARD */
        <Card className="space-y-6 bg-card border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-heading">{activeSub.planName}</h3>
                  {getSubStatusBadge(activeSub.status)}
                </div>
                <p className="text-xs text-secondaryText mt-0.5 font-medium">
                  {planDetails?.description || 'Allocated SaaS subscription tier with custom billing limits.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Billing Rate</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(activeSub.amount)}
                <span className="text-xs text-mutedText font-semibold"> /{activeSub.billingCycle.toLowerCase()}</span>
              </p>
            </div>
          </div>

          {/* Timeline & Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary border border-border text-xs">
            <div>
              <span className="text-[10px] font-bold text-mutedText uppercase">Billing Cycle</span>
              <p className="font-bold text-heading mt-0.5">{activeSub.billingCycle}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-mutedText uppercase">Start Date</span>
              <p className="font-bold text-heading mt-0.5">{formatDate(activeSub.startDate)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-mutedText uppercase">Expiry / Renewal Date</span>
              <p className="font-bold text-primary font-mono mt-0.5">{formatDate(activeSub.nextBillingDate)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-mutedText uppercase">Next Billing Date</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{formatDate(activeSub.nextBillingDate)}</p>
            </div>
          </div>

          {/* Features & Usage Limits */}
          {planDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
              {/* Features Included */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Features Included</span>
                <ul className="space-y-2 text-xs">
                  {planDetails.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-primaryText font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Usage Limits */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">Usage Limits & Allocation</span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-secondaryText font-semibold">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span>Max Customers: <strong className="text-heading">{planDetails.maxCustomers || '5,000 Customers'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-secondaryText font-semibold">
                    <HardDrive className="w-4 h-4 text-primary shrink-0" />
                    <span>Storage Capacity: <strong className="text-heading">{planDetails.storage || '100 GB Cloud Storage'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-secondaryText font-semibold">
                    <Code2 className="w-4 h-4 text-primary shrink-0" />
                    <span>API Rate Limit: <strong className="text-heading">{planDetails.apiAccess || 'Full REST API'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-secondaryText font-semibold">
                    <Headphones className="w-4 h-4 text-primary shrink-0" />
                    <span>Support Level: <strong className="text-heading">{planDetails.supportLevel || '24/7 Support'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Recent Invoices Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-heading">My Recent Invoices</h3>
          <button
            onClick={() => navigate('/customer/invoices')}
            className="text-xs font-semibold text-primary hover:underline transition-colors"
          >
            View All Invoices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Invoice ID</th>
                <th className="p-3 font-semibold">Issue Date</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-mutedText font-medium">
                    No recent invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="p-3 text-secondaryText font-medium">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-bold text-heading">{formatCurrency(inv.amount)}</td>
                    <td className="p-3">
                      <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>{inv.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert(`Downloading Invoice ${inv.invoiceNumber} PDF...`)}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
