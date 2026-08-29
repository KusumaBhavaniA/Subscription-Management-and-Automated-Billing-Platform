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
import { billingApi } from '../../services/api/billingApi';
import { authService } from '../../services/authService';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

      const dbInvoices = await billingApi.getMyInvoices();
      if (dbInvoices && dbInvoices.length > 0) {
        setInvoices(dbInvoices);
      } else {
        const allInvoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
        setInvoices(
          allInvoices.filter(
            (inv) => inv.customerEmail.toLowerCase() === (user?.email || '').toLowerCase()
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Customer';
  const isSuspended = user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended';
  const accountStatus = isSuspended ? 'SUSPENDED' : (user?.status || 'Verified');
  const isProfileIncomplete = authService.isProfileIncomplete(user);

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
      {/* WELCOME & SUMMARY SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-heading">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-secondaryText font-medium mt-1">
              Here's a quick overview of your billing workspace.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/customer/subscriptions')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            My Subscription
          </Button>
        </div>

        {/* PROMINENT SUSPENSION WARNING CARD */}
        {isSuspended && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-md space-y-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-heading">
                  Your Account Has Been Suspended
                </h3>
                <p className="text-xs text-secondaryText leading-relaxed font-medium">
                  Your account has been temporarily suspended by an administrator. You can still access your account, but subscription purchases and payments are currently disabled.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/customer/support')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm cursor-pointer"
              >
                Request Account Restoration →
              </Button>
            </div>
          </motion.div>
        )}

        {/* 4 SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Plan */}
          <div className="p-4 rounded-2xl bg-card border border-border text-primaryText shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <BookmarkCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText block truncate">
                Current Plan
              </span>
              <p className="font-extrabold text-sm text-heading truncate mt-0.5">
                {hasActiveSubscription ? `${activeSub?.planName}` : 'None'}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="p-4 rounded-2xl bg-card border border-border text-primaryText shadow-xs flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              isSuspended
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText block truncate">
                Account Status
              </span>
              <p className={`font-extrabold text-sm truncate mt-0.5 ${
                isSuspended ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {accountStatus}
              </p>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-4 rounded-2xl bg-card border border-border text-primaryText shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText block truncate">
                Subscription Status
              </span>
              <div className="mt-0.5">
                {getSubStatusBadge(activeSub?.status)}
              </div>
            </div>
          </div>

          {/* Next Renewal */}
          <div className="p-4 rounded-2xl bg-card border border-border text-primaryText shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText block truncate">
                Next Renewal
              </span>
              <p className="font-extrabold text-xs text-heading font-mono truncate mt-0.5">
                {hasActiveSubscription && activeSub?.nextBillingDate ? formatDate(activeSub.nextBillingDate) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* PROFILE COMPLETION CARD */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 sm:p-5 bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-heading">Complete your profile</h3>
                <p className="text-xs text-secondaryText font-medium mt-0.5">
                  Add your missing details to keep your billing account up to date.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/customer/profile')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="shrink-0 self-start sm:self-auto"
            >
              Complete Profile
            </Button>
          </motion.div>
        )}
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
                  <Badge variant="brand">{activeSub.billingCycle}</Badge>
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
