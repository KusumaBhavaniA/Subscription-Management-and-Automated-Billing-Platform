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

const hasActiveSubscriptionPlan = (planName?: string): boolean => {
  return !!planName && planName !== 'None' && planName !== 'No active plan';
};

export const billingApi = {
  /**
   * Fetches customer-specific billing summary data aggregated from local storage & API services.
   */
  getCustomerBillingSummary: async (email: string, userCreatedAt?: string): Promise<CustomerBillingSummary> => {
    // Simulate slight API latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch User & Customer record
    const users = getItem<any[]>(STORAGE_KEYS.USERS, []);
    const userRecord = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const customer = customers.find((c) => c.email?.toLowerCase() === cleanEmail);

    // 2. Fetch Customer Invoices & Payments
    const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const customerInvoices = invoices.filter((i) => i.customerEmail?.toLowerCase() === cleanEmail);

    const payments = getItem<any[]>(STORAGE_KEYS.PAYMENTS, []);
    const customerPayments = payments.filter((p) => p.customerEmail?.toLowerCase() === cleanEmail);

    // 3. Fetch Customer Subscriptions
    const subscriptions = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    const activeSub = subscriptions.find((s) => s.customerEmail?.toLowerCase() === cleanEmail);

    // Calculate metrics
    const paidInvoices = customerInvoices.filter((i) => i.status === 'Paid');
    const successfulPayments = customerPayments.filter((p) => p.status === 'Success' || p.status === 'Paid');

    const pendingInvoices = customerInvoices.filter((i) => i.status === 'Pending');
    const overdueInvoices = customerInvoices.filter((i) => i.status === 'Overdue');
    const failedPayments = customerPayments.filter((p) => p.status === 'Failed');

    const totalInvoiceSpent = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaymentSpent = successfulPayments.reduce((sum, p) => sum + (p.amountPaid || p.amount || 0), 0);
    const totalSpent = totalInvoiceSpent + totalPaymentSpent;

    const paymentsCompletedCount = paidInvoices.length + successfulPayments.length;
    const averageMonthlySpend = paymentsCompletedCount > 0 ? Math.round(totalSpent / Math.max(1, paymentsCompletedCount)) : 0;

    const discounts: DiscountRecord[] = [];
    const totalSavings = 0;

    const currentSubscriptionCost = activeSub ? activeSub.amount : (customer?.mrr || 0);
    const currentPlanName = activeSub ? activeSub.planName : (customer && customer.subscriptionPlan !== 'None' ? customer.subscriptionPlan : 'No active plan');

    // Determine latest payment date
    const allDates: string[] = [
      ...paidInvoices.map((i) => i.issueDate),
      ...successfulPayments.map((p) => p.date || p.paymentDate),
    ].filter(Boolean);
    const sortedDates = [...allDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const latestPaymentDate = sortedDates.length > 0 ? sortedDates[0] : null;

    // Payment Summary stats
    const paymentSummary: PaymentSummaryStats = {
      successfulCount: paymentsCompletedCount,
      successfulAmount: totalSpent,
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((s, i) => s + i.amount, 0),
      failedCount: overdueInvoices.length + failedPayments.length,
      failedAmount: overdueInvoices.reduce((s, i) => s + i.amount, 0) + failedPayments.reduce((s, p) => s + (p.amount || 0), 0),
      refundedCount: 0,
      refundedAmount: 0,
      latestPaymentDate,
    };

    // Monthly spending trend calculation (6 months)
    const monthNames = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
    const spendingTrend: MonthlyTrendPoint[] = monthNames.map((month) => ({
      month,
      amount: totalSpent > 0 ? averageMonthlySpend : 0,
    }));

    // Derive Customer Since from exact registration date
    const rawCreated = userCreatedAt || userRecord?.createdAt || userRecord?.registrationDate || customer?.registrationDate || customer?.joinedDate || new Date().toISOString();
    const customerSinceDate = rawCreated.includes('T') ? rawCreated.split('T')[0] : rawCreated;

    return {
      totalSpent,
      totalSavings,
      currentSubscriptionCost,
      currentPlanName,
      averageMonthlySpend,
      paymentsCompletedCount,

      billingCycle: activeSub?.billingCycle || (hasActiveSubscriptionPlan(currentPlanName) ? 'Monthly' : 'N/A'),
      subscriptionStatus: activeSub?.status || (hasActiveSubscriptionPlan(currentPlanName) ? 'Active' : 'Inactive'),
      renewalDate: activeSub?.nextBillingDate || 'N/A',
      nextBillingAmount: currentSubscriptionCost,

      paymentSummary,
      discounts,
      recentInvoices: customerInvoices,
      spendingTrend,

      customerSince: customerSinceDate,
      membershipStatus: activeSub?.status || customer?.status || (userRecord ? 'Verified' : 'Active'),
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
