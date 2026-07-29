import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, ArrowRight, Download, Sparkles, X, ShieldCheck, Calendar, BookmarkCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeCard, setShowWelcomeCard] = useState(true);

  const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  const subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);

  const userInvoices = invoices.filter(
    (inv) => inv.customerEmail.toLowerCase() === (user?.email || '').toLowerCase()
  );

  const activeSub = subscriptions.find(
    (sub) => sub.customerEmail.toLowerCase() === (user?.email || '').toLowerCase()
  ) || {
    id: 'sub-demo',
    customerName: user?.fullName || 'Valued Customer',
    customerEmail: user?.email || '',
    planName: user?.currentPlan || 'Starter',
    status: 'Active' as const,
    billingCycle: 'Monthly' as const,
    amount: 1999,
    startDate: user?.createdAt || '2026-07-28',
    nextBillingDate: '2026-08-15',
  };

  const customerName = user?.fullName || 'Customer';
  const currentPlan = user?.currentPlan || 'Starter';
  const accountStatus = user?.status || 'Verified';
  const subscriptionStatus = user?.subscriptionStatus || 'Active';
  const nextRenewal = '15 August 2026';

  return (
    <div className="space-y-6">
      {/* VERIFIED CUSTOMER ONBOARDING WELCOME CARD */}
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
                  We're happy to see you again. Your Billing Platform account is fully set up and active.
                </p>
              </div>

              {/* Grid Metrics inside Welcome Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary p-4 rounded-xl border border-border shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Current Plan
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-heading">
                    <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                    <span>{currentPlan}</span>
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
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>{subscriptionStatus}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">
                    Next Renewal
                  </span>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-primary font-mono">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{nextRenewal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
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
            Manage your billing subscriptions, view past statements, and download invoices.
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

      {/* Subscription Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-heading">Active Subscription</h3>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <span className="text-xs text-mutedText uppercase tracking-wider font-semibold">Plan Name</span>
              <p className="text-base font-bold text-heading mt-0.5">{activeSub.planName}</p>
            </div>
            <div>
              <span className="text-xs text-mutedText uppercase tracking-wider font-semibold">Billing Rate</span>
              <p className="text-base font-bold text-heading mt-0.5">
                {formatCurrency(activeSub.amount)} / {activeSub.billingCycle}
              </p>
            </div>
            <div>
              <span className="text-xs text-mutedText uppercase tracking-wider font-semibold">Next Invoice</span>
              <p className="text-base font-bold text-primary font-mono mt-0.5">{nextRenewal}</p>
            </div>
          </div>
        </Card>

        {/* Account Status Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">Account Verification</span>
            <div className="flex items-center gap-2 text-success font-bold text-lg mt-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span>Verified Customer</span>
            </div>
            <p className="text-xs text-secondaryText mt-1">
              Customer ID: <code className="font-mono font-bold text-primaryText">{user?.customerId || 'CUS-2026-000124'}</code>
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Invoices Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-heading">My Recent Invoices</h3>
          <button
            onClick={() => navigate('/customer/invoices')}
            className="text-xs font-semibold text-primary hover:underline transition-colors"
          >
            View All
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
              {userInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-mutedText">
                    No recent invoices found.
                  </td>
                </tr>
              ) : (
                userInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/60 transition-colors">
                    <td className="p-3 font-semibold text-heading">{inv.invoiceNumber}</td>
                    <td className="p-3 text-secondaryText">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-semibold text-heading">{formatCurrency(inv.amount)}</td>
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
