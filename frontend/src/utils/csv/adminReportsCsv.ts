import { ReportTab, AdminReportData } from '../pdf/adminReportsPdf';
import { formatCurrency } from '../formatters';

function triggerCsvDownload(filename: string, rows: Record<string, unknown>[]) {
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

export const generateAdminReportCSV = (
  activeTab: ReportTab,
  data: AdminReportData
): void => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (activeTab === 'revenue') {
    const filename = `Revenue-MRR-Report-${todayStr}.csv`;
    triggerCsvDownload(filename, [
      { Category: 'Paid Revenue', Amount: formatCurrency(data.totalRevenue) },
      { Category: 'Pending Revenue', Amount: formatCurrency(data.pendingRevenue) },
      { Category: 'MRR (Recurring)', Amount: formatCurrency(data.totalMRR) },
      { Category: 'Paid Invoices Count', Amount: data.paidInvoicesCount.toString() },
    ]);
  } else if (activeTab === 'customers') {
    const filename = `Customer-Growth-Report-${todayStr}.csv`;
    if (data.customers.length === 0) {
      triggerCsvDownload(filename, [
        { 'Customer ID': '', 'Customer Name': 'No data available for this report', Email: '', Phone: '', Status: '', Plan: '', MRR: '', Joined: '' },
      ]);
    } else {
      triggerCsvDownload(
        filename,
        data.customers.map((c) => {
          const rawId = c.customerId || c.id || 'CUS-2026';
          const formattedId = rawId.startsWith('CUS-')
            ? rawId
            : rawId.startsWith('cust-')
            ? `CUS-2026-00000${rawId.replace('cust-', '')}`
            : rawId;

          return {
            'Customer ID': formattedId,
            'Customer Name': c.name || 'Customer',
            Email: c.email || 'N/A',
            Phone: c.phone || 'N/A',
            Status: c.status || 'Active',
            Plan: c.subscriptionPlan || 'No Plan',
            MRR: formatCurrency(c.mrr || 0),
            Joined: c.joinedDate || c.registrationDate || '',
          };
        })
      );
    }
  } else if (activeTab === 'subscriptions') {
    const filename = `Subscriptions-Report-${todayStr}.csv`;
    if (data.subscriptions.length === 0) {
      triggerCsvDownload(filename, [
        { 'Subscription ID': '', 'Customer Email': 'No data available for this report', Plan: '', Status: '', Cycle: '', Amount: '', 'Next Renewal': '' },
      ]);
    } else {
      triggerCsvDownload(
        filename,
        data.subscriptions.map((s) => ({
          'Subscription ID': s.id || 'SUB-2026',
          'Customer Email': s.customerEmail || 'N/A',
          Plan: s.planName || 'Standard Plan',
          Status: s.status || 'Active',
          Cycle: s.billingCycle || 'Monthly',
          Amount: formatCurrency(s.amount || 0),
          'Next Renewal': s.nextBillingDate || '',
        }))
      );
    }
  } else if (activeTab === 'invoices') {
    const filename = `Invoices-Report-${todayStr}.csv`;
    if (data.invoices.length === 0) {
      triggerCsvDownload(filename, [
        { 'Invoice Number': '', 'Customer Name': 'No data available for this report', Amount: '', Status: '', 'Issue Date': '', 'Due Date': '' },
      ]);
    } else {
      triggerCsvDownload(
        filename,
        data.invoices.map((inv) => ({
          'Invoice Number': inv.invoiceNumber || inv.id || 'INV-2026',
          'Customer Name': inv.customerName || inv.customerEmail || 'Customer',
          Amount: formatCurrency(inv.amount || 0),
          Status: inv.status || 'Paid',
          'Issue Date': inv.issueDate || '',
          'Due Date': inv.dueDate || '',
        }))
      );
    }
  }
};
