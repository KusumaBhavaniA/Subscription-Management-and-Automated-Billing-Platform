import jsPDF from 'jspdf';
import {
  addPdfHeader,
  addPdfFooter,
  drawPdfSectionHeader,
  drawPdfInfoGrid,
  renderPdfTable,
  formatPdfCurrency,
  formatPdfDate,
} from './pdfBase';
import { Customer } from '../../types/customer';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';

export type ReportTab = 'revenue' | 'customers' | 'subscriptions' | 'invoices';

export interface AdminReportData {
  customers: Customer[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  totalRevenue: number;
  pendingRevenue: number;
  totalMRR: number;
  paidInvoicesCount: number;
  totalCustomers: number;
  verifiedCustomers: number;
  pendingCustomers: number;
  suspendedCustomers: number;
  activeSubscriptionsCount: number;
  cancelledSubscriptionsCount: number;
  pausedSubscriptionsCount: number;
}

export const generateAdminReportPDF = (
  activeTab: ReportTab,
  data: AdminReportData
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  if (activeTab === 'revenue') {
    // 1. REVENUE & MRR REPORT
    addPdfHeader(doc, 'Revenue & MRR Report', 'Financial Performance & Audit Overview');

    let y = 36;
    y = drawPdfSectionHeader(doc, 'Executive Revenue Summary', y);
    y = drawPdfInfoGrid(
      doc,
      [
        { label: 'Total Revenue', value: formatPdfCurrency(data.totalRevenue) },
        { label: 'Pending Revenue', value: formatPdfCurrency(data.pendingRevenue) },
        { label: 'Monthly Recurring Revenue (MRR)', value: formatPdfCurrency(data.totalMRR) },
        { label: 'Paid Invoices Count', value: String(data.paidInvoicesCount) },
      ],
      y,
      2
    );

    y = drawPdfSectionHeader(doc, 'Revenue Breakdown by Category', y);
    y = renderPdfTable(doc, {
      startY: y,
      head: [['Revenue Category', 'Classification', 'Total Amount']],
      body: [
        ['Paid Revenue', 'Settled Invoices', formatPdfCurrency(data.totalRevenue)],
        ['Pending Revenue', 'Unpaid & Overdue Invoices', formatPdfCurrency(data.pendingRevenue)],
        ['Monthly Recurring Revenue (MRR)', 'Active Customer Subscriptions', formatPdfCurrency(data.totalMRR)],
      ],
    });

    addPdfFooter(doc, 'Revenue & MRR Report');
    doc.save(`Revenue-MRR-Report-${todayStr}.pdf`);
  } else if (activeTab === 'customers') {
    // 2. CUSTOMER GROWTH REPORT
    addPdfHeader(doc, 'Customer Growth Report', 'Subscriber Growth & Verification Directory');

    let y = 36;
    y = drawPdfSectionHeader(doc, 'Customer Demographics Summary', y);
    y = drawPdfInfoGrid(
      doc,
      [
        { label: 'Total Customers', value: String(data.totalCustomers) },
        { label: 'Verified / Active', value: String(data.verifiedCustomers) },
        { label: 'Pending Verification', value: String(data.pendingCustomers) },
        { label: 'Suspended Accounts', value: String(data.suspendedCustomers) },
      ],
      y,
      2
    );

    y = drawPdfSectionHeader(doc, 'Customer Directory', y);

    if (data.customers.length === 0) {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Customer ID', 'Customer Name', 'Email Address', 'Plan', 'MRR', 'Status']],
        body: [['No data available for this report.', '', '', '', '', '']],
        bodyStyles: { fontStyle: 'italic', textColor: [100, 100, 100] },
      });
    } else {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Customer ID', 'Customer Name', 'Email Address', 'Plan', 'MRR', 'Status']],
        body: data.customers.map((c) => {
          const rawId = c.customerId || c.id || 'CUS-2026';
          const formattedId = rawId.startsWith('CUS-')
            ? rawId
            : rawId.startsWith('cust-')
            ? `CUS-2026-00000${rawId.replace('cust-', '')}`
            : rawId;

          return [
            formattedId,
            c.name || 'Customer',
            c.email || 'N/A',
            c.subscriptionPlan || 'No Plan',
            formatPdfCurrency(c.mrr || 0),
            c.status || 'Active',
          ];
        }),
      });
    }

    addPdfFooter(doc, 'Customer Growth Report');
    doc.save(`Customer-Growth-Report-${todayStr}.pdf`);
  } else if (activeTab === 'subscriptions') {
    // 3. SUBSCRIPTIONS REPORT
    addPdfHeader(doc, 'Subscriptions Report', 'Active Tiers & Renewal Metrics');

    let y = 36;
    y = drawPdfSectionHeader(doc, 'Subscription Status Summary', y);
    y = drawPdfInfoGrid(
      doc,
      [
        { label: 'Total Subscriptions', value: String(data.subscriptions.length) },
        { label: 'Active Subscriptions', value: String(data.activeSubscriptionsCount) },
        { label: 'Cancelled Subscriptions', value: String(data.cancelledSubscriptionsCount) },
        { label: 'Paused / Inactive', value: String(data.pausedSubscriptionsCount) },
      ],
      y,
      2
    );

    y = drawPdfSectionHeader(doc, 'All Subscriptions Detail', y);

    if (data.subscriptions.length === 0) {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Subscription ID', 'Customer Email', 'Plan Name', 'Billing Cycle', 'Status', 'Amount']],
        body: [['No data available for this report.', '', '', '', '', '']],
        bodyStyles: { fontStyle: 'italic', textColor: [100, 100, 100] },
      });
    } else {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Subscription ID', 'Customer Email', 'Plan Name', 'Billing Cycle', 'Status', 'Amount']],
        body: data.subscriptions.map((s) => [
          s.id || 'SUB-2026',
          s.customerEmail || 'N/A',
          s.planName || 'Standard Plan',
          s.billingCycle || 'Monthly',
          s.status || 'Active',
          formatPdfCurrency(s.amount || 0),
        ]),
      });
    }

    addPdfFooter(doc, 'Subscriptions Report');
    doc.save(`Subscriptions-Report-${todayStr}.pdf`);
  } else if (activeTab === 'invoices') {
    // 4. INVOICES REPORT
    addPdfHeader(doc, 'Invoices Report', 'Comprehensive Billing Transaction Log');

    let y = 36;
    const pendingCount = data.invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue').length;

    y = drawPdfSectionHeader(doc, 'Invoice Processing Summary', y);
    y = drawPdfInfoGrid(
      doc,
      [
        { label: 'Total Invoices', value: String(data.invoices.length) },
        { label: 'Paid Invoices', value: String(data.paidInvoicesCount) },
        { label: 'Pending / Overdue', value: String(pendingCount) },
        { label: 'Total Settled Amount', value: formatPdfCurrency(data.totalRevenue) },
      ],
      y,
      2
    );

    y = drawPdfSectionHeader(doc, 'Invoice Transactions History', y);

    if (data.invoices.length === 0) {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Invoice Number', 'Customer Name', 'Issue Date', 'Due Date', 'Amount', 'Status']],
        body: [['No data available for this report.', '', '', '', '', '']],
        bodyStyles: { fontStyle: 'italic', textColor: [100, 100, 100] },
      });
    } else {
      y = renderPdfTable(doc, {
        startY: y,
        head: [['Invoice Number', 'Customer Name', 'Issue Date', 'Due Date', 'Amount', 'Status']],
        body: data.invoices.map((inv) => [
          inv.invoiceNumber || inv.id || 'INV-2026',
          inv.customerName || inv.customerEmail || 'Customer',
          formatPdfDate(inv.issueDate),
          formatPdfDate(inv.dueDate),
          formatPdfCurrency(inv.amount || 0),
          inv.status || 'Paid',
        ]),
      });
    }

    addPdfFooter(doc, 'Invoices Report');
    doc.save(`Invoices-Report-${todayStr}.pdf`);
  }
};
