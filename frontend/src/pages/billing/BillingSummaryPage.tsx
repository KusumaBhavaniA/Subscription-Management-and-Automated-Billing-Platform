import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Receipt,
  Award,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { billingApi, CustomerBillingSummary } from '../../services/api/billingApi';
import { paymentApi } from '../../services/api/paymentApi';

export const BillingSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CustomerBillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const fetchBillingSummary = async () => {
      setIsLoading(true);
      try {
        if (user?.email) {
          const summary = await billingApi.getCustomerBillingSummary(
            user.email,
            user.createdAt || user.registrationDate
          );
          setData(summary);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('Failed to load customer billing summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingSummary();
  }, [user]);

  const maxTrendAmount = useMemo(() => {
    if (!data?.spendingTrend || data.spendingTrend.length === 0) return 10000;
    return Math.max(...data.spendingTrend.map((t) => t.amount), 5000);
  }, [data]);

  const handlePrintStatement = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    setGeneratingType('top');
    try {
      await billingApi.downloadBillingStatementPDF(data, user);
      setToast({ isVisible: true, message: 'PDF downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Unable to generate PDF. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingType(null);
    }
  };

  const handleDownloadStatementPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    setGeneratingType('statement');
    try {
      await billingApi.downloadBillingStatementPDF(data, user);
      setToast({ isVisible: true, message: 'PDF downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Unable to generate PDF. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingType(null);
    }
  };

  const handleDownloadPaymentHistoryPdf = async () => {
    if (!data || !user?.email) return;
    setIsGeneratingPdf(true);
    setGeneratingType('history');
    try {
      const customerPayments = await paymentApi.getPaymentTransactions(user.email, user.role);
      const paymentsToExport = customerPayments.length > 0 ? customerPayments : data.recentInvoices;
      await billingApi.downloadPaymentHistoryPDF(paymentsToExport, user);
      setToast({ isVisible: true, message: 'PDF downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Unable to generate PDF. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingType(null);
    }
  };

  const handleDownloadTaxInvoicePdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    setGeneratingType('invoice');
    try {
      await billingApi.downloadTaxInvoicePDF(data, user);
      setToast({ isVisible: true, message: 'PDF downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Unable to generate PDF. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingType(null);
    }
  };

  const handleDownloadReceiptsPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    setGeneratingType('receipt');
    try {
      const result = await billingApi.downloadReceiptsPDF(data, user);
      if (result.success) {
        setToast({ isVisible: true, message: 'PDF downloaded successfully.', type: 'success' });
      } else {
        setToast({
          isVisible: true,
          message: result.message || 'No payment receipts are available because no completed payments exist.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Unable to generate PDF. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
      setGeneratingType(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm font-semibold text-secondaryText mt-4">
            Loading your personal billing summary...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Billing Summary
            </h1>
            <Badge variant="brand">Personal Account</Badge>
          </div>
          <p className="text-xs text-secondaryText mt-1 font-medium">
            View your personal payment history, active subscription breakdown, discounts, and spending statements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrintStatement}
          >
            Print Statement
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
          >
            {generatingType === 'top' ? 'Generating PDF...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* SECTION 1: SPENDING OVERVIEW */}
      <section space-y-3>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-mutedText flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            1. Spending Overview
          </h2>
          <span className="text-xs text-secondaryText font-medium">Customer-only metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Amount Spent */}
          <Card className="p-5 border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-mutedText mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Spent</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-heading">{formatCurrency(data.totalSpent)}</p>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Lifetime Customer Investment
            </p>
          </Card>

          {/* Card 2: Total Savings */}
          <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-mutedText mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Savings</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalSavings)}
            </p>
            <p className="text-[11px] font-semibold text-secondaryText mt-1">
              Discounts & Offers Received
            </p>
          </Card>

          {/* Card 3: Current Plan */}
          <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-mutedText mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Current Plan</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-black text-heading truncate">{data.currentPlanName}</p>
            <p className="text-[11px] font-bold text-primary mt-1">
              {formatCurrency(data.currentSubscriptionCost)} / {data.billingCycle.toLowerCase()}
            </p>
          </Card>

          {/* Card 4: Average Monthly Spend */}
          <Card className="p-5 border-l-4 border-l-violet-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-mutedText mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Monthly Spend</span>
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-heading">{formatCurrency(data.averageMonthlySpend)}</p>
            <p className="text-[11px] font-semibold text-secondaryText mt-1">
              Based on active usage history
            </p>
          </Card>

          {/* Card 5: Payments Completed */}
          <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-mutedText mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Payments Completed</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-heading">{data.paymentsCompletedCount}</p>
            <p className="text-[11px] font-semibold text-success mt-1">
              100% On-time status
            </p>
          </Card>
        </div>
      </section>

      {/* SECTION 2 & SECTION 3: CURRENT SUBSCRIPTION & PAYMENT SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: CURRENT SUBSCRIPTION */}
        <Card className="p-6 space-y-4 bg-card border border-border">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              2. Current Subscription
            </h3>
            <Badge variant={data.subscriptionStatus === 'Active' ? 'success' : 'warning'}>
              {data.subscriptionStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-secondary border border-border">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Current Plan</span>
              <p className="font-black text-base text-heading mt-1">{data.currentPlanName}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-border">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Billing Cycle</span>
              <p className="font-bold text-sm text-heading mt-1">{data.billingCycle}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-border">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Subscription Status</span>
              <div className="mt-1">
                <Badge variant={data.subscriptionStatus === 'Active' ? 'success' : 'neutral'}>
                  {data.subscriptionStatus}
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-border">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Renewal Date</span>
              <p className="font-bold text-sm text-primary font-mono mt-1">{formatDate(data.renewalDate)}</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-xs font-bold text-primaryText">Next Billing Amount</span>
            <span className="text-lg font-black text-primary font-mono">
              {formatCurrency(data.nextBillingAmount)}
            </span>
          </div>
        </Card>

        {/* SECTION 3: PAYMENT SUMMARY */}
        <Card className="p-6 space-y-4 bg-card border border-border">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-500" />
              3. Payment Summary
            </h3>
            <span className="text-xs font-bold text-secondaryText">
              Latest: {data.paymentSummary.latestPaymentDate ? formatDate(data.paymentSummary.latestPaymentDate) : 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Successful */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Successful Payments
                </span>
              </div>
              <p className="text-xl font-black text-heading">{data.paymentSummary.successfulCount}</p>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(data.paymentSummary.successfulAmount)}
              </p>
            </div>

            {/* Pending */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Pending Payments
                </span>
              </div>
              <p className="text-xl font-black text-heading">{data.paymentSummary.pendingCount}</p>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(data.paymentSummary.pendingAmount)}
              </p>
            </div>

            {/* Failed */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Failed Payments
                </span>
              </div>
              <p className="text-xl font-black text-heading">{data.paymentSummary.failedCount}</p>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(data.paymentSummary.failedAmount)}
              </p>
            </div>

            {/* Refunded */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  Refunded Payments
                </span>
              </div>
              <p className="text-xl font-black text-heading">{data.paymentSummary.refundedCount}</p>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {formatCurrency(data.paymentSummary.refundedAmount)}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-semibold text-secondaryText px-1">
            <span>Latest Account Transaction Date</span>
            <span className="font-bold text-heading font-mono">
              {data.paymentSummary.latestPaymentDate ? formatDate(data.paymentSummary.latestPaymentDate) : 'N/A'}
            </span>
          </div>
        </Card>
      </div>

      {/* SECTION 4: DISCOUNTS & SAVINGS */}
      <Card className="p-6 space-y-4 bg-card border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              4. Discounts & Savings
            </h3>
            <p className="text-xs text-secondaryText mt-0.5">
              Itemized list of promotional offers, referral bonuses, and coupons applied to your account.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText">Total Lifetime Savings</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalSavings)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-bold">Discount Name</th>
                <th className="p-3 font-bold">Date Received</th>
                <th className="p-3 font-bold text-right">Amount Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.discounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-secondaryText font-medium">
                    No discount or promotional offers applied yet.
                  </td>
                </tr>
              ) : (
                data.discounts.map((disc) => (
                  <tr key={disc.id} className="hover:bg-secondary/60 transition-colors">
                    <td className="p-3 font-bold text-heading flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{disc.name}</span>
                    </td>
                    <td className="p-3 text-secondaryText font-medium font-mono">{formatDate(disc.date)}</td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(disc.amountSaved)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-secondary/80 border-t-2 border-border font-bold">
                <td colSpan={2} className="p-3 text-right text-heading uppercase tracking-wider text-[11px]">
                  Total Savings:
                </td>
                <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 text-sm font-black">
                  {formatCurrency(data.totalSavings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* SECTION 5: BILLING HISTORY */}
      <Card className="p-6 space-y-4 bg-card border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              5. Billing History
            </h3>
            <p className="text-xs text-secondaryText mt-0.5">
              Recent invoice transactions processed for your workspace.
            </p>
          </div>
          <Badge variant="neutral">{data.recentInvoices.length} Statements</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-bold">Invoice Number</th>
                <th className="p-3 font-bold">Payment Date</th>
                <th className="p-3 font-bold">Amount</th>
                <th className="p-3 font-bold">Payment Method</th>
                <th className="p-3 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-secondaryText font-medium">
                    No invoice statements available yet.
                  </td>
                </tr>
              ) : (
                data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="p-3 text-secondaryText font-medium font-mono">{formatDate(inv.issueDate)}</td>
                    <td className="p-3 font-bold text-heading">{formatCurrency(inv.amount)}</td>
                    <td className="p-3 text-mutedText font-semibold">Stripe (Visa •••• 4242)</td>
                    <td className="p-3 text-right">
                      <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 6: SPENDING TREND */}
      <Card className="p-6 space-y-4 bg-card border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              6. Personal Spending Trend
            </h3>
            <p className="text-xs text-secondaryText mt-0.5">
              Monthly spending trend breakdown for your individual account.
            </p>
          </div>
          <span className="text-xs font-semibold text-secondaryText">Monthly Spend (INR)</span>
        </div>

        {/* Responsive Custom SVG / CSS Bar Chart strictly for Customer */}
        <div className="pt-4 pb-2">
          <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 px-4">
            {data.spendingTrend.map((pt, idx) => {
              const heightPct = Math.max(Math.round((pt.amount / maxTrendAmount) * 100), 12);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-heading opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(pt.amount)}
                  </span>
                  <div className="w-full bg-secondary rounded-t-xl h-full max-h-36 flex items-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary/70 to-primary rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-mutedText truncate">{pt.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* SECTION 7: DOWNLOADS */}
      <Card className="p-6 space-y-4 bg-card border border-border">
        <div className="pb-3 border-b border-border">
          <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            7. Downloads & Statement Exports
          </h3>
          <p className="text-xs text-secondaryText mt-0.5">
            Download verified PDF statements, tax invoices, and payment receipts for your personal records.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="w-full justify-start py-3 cursor-pointer hover:border-primary transition-colors"
            leftIcon={<FileText className="w-4 h-4 text-primary" />}
            onClick={handleDownloadStatementPdf}
            disabled={isGeneratingPdf}
          >
            <div className="text-left">
              <span className="block font-bold text-xs">
                {generatingType === 'statement' ? 'Generating...' : 'Billing Statement (PDF)'}
              </span>
              <span className="block text-[10px] text-mutedText font-normal">Official monthly PDF audit</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-3 cursor-pointer hover:border-emerald-500 transition-colors"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
            onClick={handleDownloadPaymentHistoryPdf}
            disabled={isGeneratingPdf}
          >
            <div className="text-left">
              <span className="block font-bold text-xs">
                {generatingType === 'history' ? 'Generating...' : 'Payment History (PDF)'}
              </span>
              <span className="block text-[10px] text-mutedText font-normal">Download complete payment history</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-3 cursor-pointer hover:border-blue-500 transition-colors"
            leftIcon={<Receipt className="w-4 h-4 text-blue-500" />}
            onClick={handleDownloadTaxInvoicePdf}
            disabled={isGeneratingPdf}
          >
            <div className="text-left">
              <span className="block font-bold text-xs">
                {generatingType === 'invoice' ? 'Generating...' : 'Tax Invoice (PDF)'}
              </span>
              <span className="block text-[10px] text-mutedText font-normal">Download official tax invoice</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-3 cursor-pointer hover:border-amber-500 transition-colors"
            leftIcon={<Award className="w-4 h-4 text-amber-500" />}
            onClick={handleDownloadReceiptsPdf}
            disabled={isGeneratingPdf}
          >
            <div className="text-left">
              <span className="block font-bold text-xs">
                {generatingType === 'receipt' ? 'Generating...' : 'Payment Receipts (PDF)'}
              </span>
              <span className="block text-[10px] text-mutedText font-normal">Download payment receipts</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* SECTION 8: ACCOUNT SUMMARY */}
      <Card className="p-6 space-y-4 bg-card border border-border">
        <div className="pb-3 border-b border-border">
          <h3 className="text-base font-extrabold text-heading flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-success" />
            8. Account Summary
          </h3>
          <p className="text-xs text-secondaryText mt-0.5">
            Verified membership stats and account status summary.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-secondary border border-border">
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Customer Since</span>
            <p className="font-bold text-heading mt-1 font-mono">{formatDate(data.customerSince)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary border border-border">
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Current Plan</span>
            <p className="font-bold text-primary mt-1 truncate">{data.currentPlanName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary border border-border">
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Membership Status</span>
            <div className="mt-1">
              <Badge variant={data.membershipStatus === 'Active' || data.membershipStatus === 'Verified' ? 'success' : 'warning'}>
                {data.membershipStatus}
              </Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary border border-border">
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Lifetime Savings</span>
            <p className="font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(data.totalSavings)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary border border-border col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Total Payments</span>
            <p className="font-black text-heading mt-1">{data.paymentsCompletedCount} Completed</p>
          </div>
        </div>
      </Card>

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
