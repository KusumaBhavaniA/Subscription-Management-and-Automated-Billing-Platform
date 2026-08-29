import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart2,
  Download,
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { PageHeader } from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';
import {
  generateRevenueReportPdf,
  generateCustomerGrowthReportPdf,
  generateSubscriptionsReportPdf,
  generateInvoicesReportPdf,
} from '../../utils/pdf/reportsPdf';

type ReportTab = 'revenue' | 'customers' | 'subscriptions' | 'invoices';

// Simple CSS bar chart bar component
const Bar: React.FC<{ value: number; max: number; color: string; label: string }> = ({
  value,
  max,
  color,
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-end gap-1 flex-col w-full">
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// Format current date in YYYY-MM-DD for file names
const getReportDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate CSV from array of objects
function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { customerApi } from '../../services/api/customerApi';
import { subscriptionManagementApi } from '../../services/api/subscriptionManagementApi';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [custList, subList] = await Promise.all([
        customerApi.getCustomers('active'),
        subscriptionManagementApi.getSubscriptions(),
      ]);
      setCustomers(custList);
      setSubscriptions(subList);

      const token = localStorage.getItem(STORAGE_KEYS.AUTH);
      let parsedToken = token;
      if (token && token.startsWith('{')) {
        try {
          parsedToken = JSON.parse(token).token || JSON.parse(token).access_token;
        } catch {}
      }

      const invRes = await fetch('http://localhost:8000/invoices/me', {
        headers: {
          ...(parsedToken ? { Authorization: `Bearer ${parsedToken}` } : {}),
        },
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (invData.success && Array.isArray(invData.invoices)) {
          setInvoices(invData.invoices);
        }
      }
    } catch (err) {
      console.warn('Reports data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  // Revenue KPIs
  const totalRevenue = invoices.reduce((s, inv) => (inv.status === 'Paid' ? s + inv.amount : s), 0);
  const pendingRevenue = invoices.reduce((s, inv) => (inv.status === 'Pending' || inv.status === 'Overdue' ? s + inv.amount : s), 0);
  const totalMRR = subscriptions.filter((s) => s.status === 'Active').reduce((s, sub) => s + (sub.amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'Paid').length;

  // Customer KPIs
  const totalCustomers = customers.length;
  const verifiedCustomers = customers.filter((c) => c.status === 'Verified' || c.status === 'Active').length;
  const pendingCustomers = customers.filter((c) => c.status === 'Pending Verification' || c.status === 'Pending').length;
  const suspendedCustomers = customers.filter((c) => c.status === 'Suspended').length;

  // Subscription KPIs
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'Active').length;
  const cancelledSubscriptions = subscriptions.filter((s) => (s.status as string) === 'Cancelled' || (s.status as string) === 'Canceled' || (s.status as string) === 'canceled').length;
  const pausedSubscriptions = subscriptions.filter((s) => s.status === 'Inactive').length;

  const tabs = [
    { id: 'revenue' as ReportTab, label: 'Revenue & MRR', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'customers' as ReportTab, label: 'Customer Growth', icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions' as ReportTab, label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'invoices' as ReportTab, label: 'Invoices', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  const handleExportCSV = () => {
    const dateStr = getReportDateString();

    if (activeTab === 'revenue') {
      const rows = [
        { Metric: 'Total Revenue (Paid)', Value: formatCurrency(totalRevenue) },
        { Metric: 'Pending Revenue', Value: formatCurrency(pendingRevenue) },
        { Metric: 'Monthly Recurring Revenue (MRR)', Value: formatCurrency(totalMRR) },
        { Metric: 'Paid Invoices Count', Value: paidInvoices },
        { Metric: 'Total Invoices Count', Value: invoices.length },
      ];
      downloadCSV(`Revenue-Report-${dateStr}.csv`, rows);
      showToast('CSV report downloaded successfully.', 'success');
    } else if (activeTab === 'customers') {
      if (!customers || customers.length === 0) {
        showToast('No data available for this report.', 'info');
        return;
      }
      downloadCSV(
        `Customer-Growth-Report-${dateStr}.csv`,
        customers.map((c) => ({
          'Customer ID': c.customerId || c.id,
          Name: c.name,
          Email: c.email,
          Plan: c.subscriptionPlan,
          Status: c.status,
          MRR: formatCurrency(c.mrr || 0),
          'Joined Date': c.joinedDate,
        }))
      );
      showToast('CSV report downloaded successfully.', 'success');
    } else if (activeTab === 'subscriptions') {
      if (!subscriptions || subscriptions.length === 0) {
        showToast('No data available for this report.', 'info');
        return;
      }
      downloadCSV(
        `Subscriptions-Report-${dateStr}.csv`,
        subscriptions.map((s) => ({
          'Subscription ID': s.id,
          'Customer Email': s.customerEmail || s.customerName || '',
          'Plan Name': s.planName || '',
          'Billing Cycle': s.billingCycle || 'Monthly',
          Status: s.status,
          Amount: formatCurrency(s.amount || 0),
          'Next Renewal': s.nextBillingDate || '',
        }))
      );
      showToast('CSV report downloaded successfully.', 'success');
    } else if (activeTab === 'invoices') {
      if (!invoices || invoices.length === 0) {
        showToast('No data available for this report.', 'info');
        return;
      }
      downloadCSV(
        `Invoices-Report-${dateStr}.csv`,
        invoices.map((inv) => ({
          'Invoice ID': inv.invoiceNumber || inv.id,
          Customer: inv.customerName || '',
          'Customer ID': inv.customerEmail || '',
          Amount: formatCurrency(inv.amount || 0),
          Status: inv.status,
          Date: inv.issueDate || '',
          'Due Date': inv.dueDate || '',
        }))
      );
      showToast('CSV report downloaded successfully.', 'success');
    }
  };

  const handlePrintPDF = () => {
    setIsGeneratingPdf(true);
    showToast('Generating PDF...', 'info');

    setTimeout(() => {
      try {
        if (activeTab === 'revenue') {
          generateRevenueReportPdf({
            totalRevenue,
            pendingRevenue,
            totalMRR,
            paidInvoices,
          });
        } else if (activeTab === 'customers') {
          generateCustomerGrowthReportPdf(customers);
        } else if (activeTab === 'subscriptions') {
          generateSubscriptionsReportPdf(subscriptions);
        } else if (activeTab === 'invoices') {
          generateInvoicesReportPdf(invoices);
        }
        setIsGeneratingPdf(false);
        showToast('PDF report downloaded successfully.', 'success');
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        setIsGeneratingPdf(false);
        showToast('Unable to generate PDF. Please try again.', 'error');
      }
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:space-y-4">
      {/* Header */}
      <div className="print:hidden">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Export financial and operational reports for audit compliance."
          icon={BarChart2}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrintPDF}
              isLoading={isGeneratingPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Print / PDF'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              disabled={isGeneratingPdf}
            >
              Export CSV
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border print:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondaryText hover:text-heading hover:bg-secondary'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* REVENUE REPORT */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: true },
              { label: 'Pending Revenue', value: formatCurrency(pendingRevenue), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: false },
              { label: 'Monthly MRR', value: formatCurrency(totalMRR), icon: BarChart2, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: true },
              { label: 'Paid Invoices', value: paidInvoices.toString(), icon: FileSpreadsheet, color: 'text-violet-500', bg: 'bg-violet-500/10', trend: true },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="p-4">
                  <div className={`p-2 rounded-lg ${s.bg} w-fit`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-3">{s.label}</p>
                  <p className="text-xl font-extrabold text-heading mt-0.5">{s.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {s.trend ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-amber-500" />
                    )}
                    <span className={`text-[10px] font-bold ${s.trend ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {s.trend ? 'On track' : 'Needs attention'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-heading mb-4">Revenue Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-secondaryText">Category</span>
                <span className="text-secondaryText">Amount</span>
              </div>
              {[
                { label: 'Paid Revenue', amount: totalRevenue, color: 'bg-emerald-500' },
                { label: 'Pending Revenue', amount: pendingRevenue, color: 'bg-amber-500' },
                { label: 'MRR (Recurring)', amount: totalMRR, color: 'bg-blue-500' },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-heading">{row.label}</span>
                    <span className="font-bold text-heading">{formatCurrency(row.amount)}</span>
                  </div>
                  <Bar value={row.amount} max={Math.max(totalRevenue, totalMRR, pendingRevenue, 1)} color={row.color} label="" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* CUSTOMER REPORT */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Customers', value: totalCustomers, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { label: 'Verified', value: verifiedCustomers, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Pending Verification', value: pendingCustomers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Suspended', value: suspendedCustomers, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Users className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-3">{s.label}</p>
                <p className="text-2xl font-extrabold text-heading mt-0.5">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 overflow-x-auto">
            <h2 className="text-sm font-bold text-heading mb-4">Customer Directory</h2>
            {customers.length === 0 ? (
              <p className="text-xs text-mutedText text-center py-6">No data available for this report.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Name', 'Email', 'Plan', 'MRR', 'Status'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-mutedText font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 10).map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-heading">{c.name}</td>
                      <td className="py-2.5 px-3 text-secondaryText">{c.email}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral">{c.subscriptionPlan || 'No Plan'}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-heading">{formatCurrency(c.mrr || 0)}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={c.status === 'Verified' || c.status === 'Active' ? 'success' : 'warning'}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* SUBSCRIPTIONS REPORT */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active', value: activeSubscriptions, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Cancelled', value: cancelledSubscriptions, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: 'Paused', value: pausedSubscriptions, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <CreditCard className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-3">{s.label} Subscriptions</p>
                <p className="text-2xl font-extrabold text-heading mt-0.5">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 overflow-x-auto">
            <h2 className="text-sm font-bold text-heading mb-4">All Subscriptions</h2>
            {subscriptions.length === 0 ? (
              <p className="text-xs text-mutedText text-center py-6">No data available for this report.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Customer', 'Plan', 'Cycle', 'Status', 'Amount'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-mutedText font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-2.5 px-3 text-secondaryText">{s.customerEmail}</td>
                      <td className="py-2.5 px-3 font-bold text-heading">{s.planName}</td>
                      <td className="py-2.5 px-3 text-secondaryText">{s.billingCycle}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={s.status === 'Active' ? 'success' : s.status === 'Cancelled' ? 'danger' : 'warning'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-heading">{formatCurrency(s.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* INVOICES REPORT */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Invoices', value: invoices.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Paid', value: paidInvoices, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Pending / Overdue', value: invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <DollarSign className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mt-3">{s.label}</p>
                <p className="text-2xl font-extrabold text-heading mt-0.5">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 overflow-x-auto">
            <h2 className="text-sm font-bold text-heading mb-4">Invoice History</h2>
            {invoices.length === 0 ? (
              <p className="text-xs text-mutedText text-center py-6">No data available for this report.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Customer', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-mutedText font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 10).map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-heading">{inv.customerName || '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-heading">{formatCurrency(inv.amount)}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-secondaryText">{inv.issueDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
