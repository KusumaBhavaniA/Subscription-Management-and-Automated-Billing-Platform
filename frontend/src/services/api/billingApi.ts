import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';

export interface DiscountRecord {
  id: string;
  name: string;
  date: string;
  amountSaved: number;
  type: string;
}

export interface PaymentSummaryStats {
  successfulCount: number;
  successfulAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  refundedCount: number;
  refundedAmount: number;
  latestPaymentDate: string | null;
}

export interface MonthlyTrendPoint {
  month: string;
  amount: number;
}

export interface CustomerBillingSummary {
  // Section 1: Spending Overview
  totalSpent: number;
  totalSavings: number;
  currentSubscriptionCost: number;
  currentPlanName: string;
  averageMonthlySpend: number;
  paymentsCompletedCount: number;

  // Section 2: Current Subscription Details
  billingCycle: string;
  subscriptionStatus: string;
  renewalDate: string;
  nextBillingAmount: number;

  // Section 3: Payment Summary
  paymentSummary: PaymentSummaryStats;

  // Section 4: Discounts & Savings
  discounts: DiscountRecord[];

  // Section 5: Recent Billing History
  recentInvoices: Invoice[];

  // Section 6: Spending Trend (Monthly)
  spendingTrend: MonthlyTrendPoint[];

  // Section 8: Account Summary
  customerSince: string;
  membershipStatus: string;
}

export const billingApi = {
  /**
   * Fetches customer-specific billing summary data aggregated from local storage & API services.
   */
  getCustomerBillingSummary: async (email: string): Promise<CustomerBillingSummary> => {
    // Simulate slight API latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch Customer record
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const customer = customers.find((c) => c.email.toLowerCase() === cleanEmail);

    // 2. Fetch Customer Invoices
    const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const customerInvoices = invoices.filter((i) => i.customerEmail.toLowerCase() === cleanEmail);

    // 3. Fetch Customer Subscriptions
    const subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const activeSub = subscriptions.find((s) => s.customerEmail.toLowerCase() === cleanEmail);

    // Calculate metrics
    const paidInvoices = customerInvoices.filter((i) => i.status === 'Paid');
    const pendingInvoices = customerInvoices.filter((i) => i.status === 'Pending');
    const overdueInvoices = customerInvoices.filter((i) => i.status === 'Overdue');

    const totalSpent = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Discounts mock collection for customer
    const discounts: DiscountRecord[] = [
      { id: 'disc-1', name: 'Welcome Offer (15% Off)', date: '2025-11-15', amountSaved: 1500, type: 'Percentage' },
      { id: 'disc-2', name: 'Festival Promotion Discount', date: '2025-12-25', amountSaved: 1250, type: 'Flat' },
      { id: 'disc-3', name: 'Referral Bonus Reward', date: '2026-02-10', amountSaved: 1000, type: 'Credit' },
      { id: 'disc-4', name: 'Annual Plan Savings', date: '2026-04-01', amountSaved: 2000, type: 'Tier Bonus' },
      { id: 'disc-5', name: 'Cashback Coupon Claimed', date: '2026-06-15', amountSaved: 500, type: 'Cashback' },
    ];
    const totalSavings = discounts.reduce((sum, d) => sum + d.amountSaved, 0);

    const currentSubscriptionCost = activeSub ? activeSub.amount : (customer?.mrr || 4999);
    const currentPlanName = activeSub ? activeSub.planName : (customer?.subscriptionPlan || 'Pro Business');
    const paymentsCompletedCount = paidInvoices.length > 0 ? paidInvoices.length : 12;

    const computedTotalSpent = totalSpent > 0 ? totalSpent : 38975;
    const averageMonthlySpend = Math.round(computedTotalSpent / (paymentsCompletedCount || 1));

    // Sort paid invoices to get latest payment date
    const sortedPaid = [...paidInvoices].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    const latestPaymentDate = sortedPaid.length > 0 ? sortedPaid[0].issueDate : '2026-07-05';

    // Payment Summary stats
    const paymentSummary: PaymentSummaryStats = {
      successfulCount: paidInvoices.length > 0 ? paidInvoices.length : 12,
      successfulAmount: computedTotalSpent,
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((s, i) => s + i.amount, 0),
      failedCount: overdueInvoices.length > 0 ? overdueInvoices.length : 1,
      failedAmount: overdueInvoices.reduce((s, i) => s + i.amount, 0) || 1999,
      refundedCount: 0,
      refundedAmount: 0,
      latestPaymentDate,
    };

    // Monthly spending trend calculation (6 months)
    const monthNames = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
    const defaultMonthlyAmounts = [4999, 4999, 4999, 4999, 4999, 4999];
    const spendingTrend: MonthlyTrendPoint[] = monthNames.map((month, idx) => ({
      month,
      amount: defaultMonthlyAmounts[idx] || averageMonthlySpend,
    }));

    return {
      totalSpent: computedTotalSpent,
      totalSavings: totalSavings || 6250,
      currentSubscriptionCost,
      currentPlanName,
      averageMonthlySpend,
      paymentsCompletedCount,

      billingCycle: activeSub?.billingCycle || 'Monthly',
      subscriptionStatus: activeSub?.status || 'Active',
      renewalDate: activeSub?.nextBillingDate || '2026-08-15',
      nextBillingAmount: currentSubscriptionCost,

      paymentSummary,
      discounts,
      recentInvoices: customerInvoices.length > 0 ? customerInvoices : [
        { id: 'inv-1002', invoiceNumber: 'INV-2026-002', customerName: customer?.name || 'Rohan Sharma', customerEmail: cleanEmail, amount: 4999, status: 'Paid', issueDate: '2026-07-05', dueDate: '2026-07-20', items: [] },
        { id: 'inv-1001', invoiceNumber: 'INV-2026-001', customerName: customer?.name || 'Rohan Sharma', customerEmail: cleanEmail, amount: 4999, status: 'Paid', issueDate: '2026-06-05', dueDate: '2026-06-20', items: [] },
        { id: 'inv-1000', invoiceNumber: 'INV-2026-000', customerName: customer?.name || 'Rohan Sharma', customerEmail: cleanEmail, amount: 4999, status: 'Paid', issueDate: '2026-05-05', dueDate: '2026-05-20', items: [] }
      ],
      spendingTrend,

      customerSince: customer?.joinedDate || '2025-11-15',
      membershipStatus: customer?.status || 'Active',
    };
  },

  /**
   * TODO: API Method for downloading PDF Billing Statement
   * Backend endpoint: GET /api/v1/customer/billing/statement?email={email}
   */
  downloadBillingStatementPDF: async (email: string): Promise<void> => {
    // TODO: Connect to FastAPI endpoint GET /api/v1/customer/billing/statement
    console.log(`[TODO: Backend API] Triggering PDF billing statement download for ${email}`);
    // Client-side fallback / window print
    window.print();
  },

  /**
   * TODO: API Method for downloading Payment History CSV
   * Backend endpoint: GET /api/v1/customer/billing/payments/csv?email={email}
   */
  downloadPaymentHistoryCSV: async (email: string, paymentsData: Array<Record<string, unknown>>): Promise<void> => {
    // TODO: Connect to FastAPI endpoint GET /api/v1/customer/billing/payments/csv
    console.log(`[TODO: Backend API] Triggering Payment History CSV export for ${email}`);
    
    // Client-side CSV download fallback
    if (!paymentsData || paymentsData.length === 0) return;
    const headers = Object.keys(paymentsData[0]);
    const csvLines = [
      headers.join(','),
      ...paymentsData.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payment_history_${email.split('@')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * TODO: API Method for downloading Tax Invoice
   * Backend endpoint: GET /api/v1/customer/billing/tax-invoice?email={email}
   */
  downloadTaxInvoice: async (email: string, invoiceNumber?: string): Promise<void> => {
    // TODO: Connect to FastAPI endpoint GET /api/v1/customer/billing/tax-invoice
    console.log(`[TODO: Backend API] Triggering Tax Invoice download for ${email}, invoice: ${invoiceNumber || 'latest'}`);
    alert(`Downloading Tax Invoice ${invoiceNumber ? `#${invoiceNumber}` : ''} for ${email}...`);
  },

  /**
   * TODO: API Method for downloading Receipts
   * Backend endpoint: GET /api/v1/customer/billing/receipts?email={email}
   */
  downloadReceipts: async (email: string): Promise<void> => {
    // TODO: Connect to FastAPI endpoint GET /api/v1/customer/billing/receipts
    console.log(`[TODO: Backend API] Triggering Receipts archive download for ${email}`);
    alert(`Downloading all payment receipts for ${email}...`);
  },
};
