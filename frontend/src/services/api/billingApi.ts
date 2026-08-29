import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Customer } from '../../types/customer';
import { Invoice } from '../../types/invoice';
import { Subscription } from '../../types/subscription';
import { User } from '../../types/auth';
import { generateBillingStatementPdf } from '../../utils/pdf/billingStatementPdf';
import { generatePaymentHistoryPdf } from '../../utils/pdf/paymentHistoryPdf';
import { generateTaxInvoicePdf } from '../../utils/pdf/taxInvoicePdf';
import { generatePaymentReceiptPdf } from '../../utils/pdf/paymentReceiptPdf';

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

const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      return parsed.token || parsed.access_token || parsed.user?.token || null;
    }
    return raw;
  } catch {
    return null;
  }
};

export interface BillingCalculationResult {
  success: boolean;
  current_plan_name: string | null;
  current_subscription_value: number;
  new_plan_name: string;
  billing_cycle: string;
  new_subscription_value: number;
  unused_value: number;
  upgrade_adjustment: number;
  downgrade_adjustment: number;
  is_upgrade: boolean;
  is_downgrade: boolean;
  gst_rate: number;
  gst_amount: number;
  total_payable: number;
}

export const billingApi = {
  /**
   * Authoritative Admin Dashboard statistics directly computed from backend SQLite database.
   */
  getAdminDashboardStats: async () => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/admin/dashboard/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          return data.stats;
        }
      }
    } catch (e) {
      console.warn('GET /admin/dashboard/stats error:', e);
    }
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      activeSubscriptions: 0,
      totalMRR: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      openTickets: 0,
      recentCustomers: [],
      recentInvoices: [],
      recentTickets: [],
    };
  },

  /**
   * Authoritative SaaS Financial Analytics directly from backend SQLite database.
   */
  getAdminAnalytics: async () => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/admin/analytics', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          return data.analytics;
        }
      }
    } catch (e) {
      console.warn('GET /admin/analytics error:', e);
    }
    return {
      arpu: 0,
      ltv: 0,
      churnRate: 0,
      totalMRR: 0,
      activeCustomers: 0,
      tierBreakdown: [],
    };
  },

  /**
   * Authoritative Admin Reports Summary directly from backend SQLite database.
   */
  getAdminReportsSummary: async () => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/admin/reports/summary', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reports) {
          return data.reports;
        }
      }
    } catch (e) {
      console.warn('GET /admin/reports/summary error:', e);
    }
    return {
      totalRevenue: 0,
      pendingRevenue: 0,
      monthlyMRR: 0,
      paidInvoicesCount: 0,
      pendingInvoicesCount: 0,
      totalInvoicesCount: 0,
    };
  },

  /**
   * Central single source of truth for billing calculation from backend.
   */
  calculateBilling: async (
    targetPlanName: string,
    billingCycle: string = 'Monthly',
    targetPlanPrice?: number
  ): Promise<BillingCalculationResult> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/billing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_plan_name: targetPlanName,
          billing_cycle: billingCycle,
          target_plan_price: targetPlanPrice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
      throw new Error('Billing calculation returned unsuccessful response from server.');
    } catch (e: any) {
      console.warn('POST /billing/calculate error:', e);
      throw new Error(e.message || 'Failed to calculate billing with backend server.');
    }
  },

  /**
   * Fetches invoices for authenticated user or admin directly from SQLite database.
   */
  getMyInvoices: async (): Promise<Invoice[]> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/invoices/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.invoices)) {
          return data.invoices as Invoice[];
        }
      }
    } catch (e) {
      console.warn('GET /invoices/me error:', e);
    }
    return [];
  },

  /**
   * Fetches payments for authenticated user or admin directly from SQLite database.
   */
  getMyPayments: async (): Promise<any[]> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/payments/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.payments)) {
          return data.payments;
        }
      }
    } catch (e) {
      console.warn('GET /payments/me error:', e);
    }
    return [];
  },



  /**
   * Fetches customer-specific billing summary data aggregated from local storage & API services.
   */
  getCustomerBillingSummary: async (email?: string): Promise<CustomerBillingSummary> => {
    const token = getAuthToken();
    const res = await fetch('http://localhost:8000/billing/summary', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.summary) {
        return data.summary as CustomerBillingSummary;
      }
    }
    throw new Error('Failed to fetch billing summary from server.');
  },


  /**
   * Generates and downloads the PDF Billing Statement directly in browser
   */
  downloadBillingStatementPDF: async (data: CustomerBillingSummary, user: User | null): Promise<void> => {
    generateBillingStatementPdf(data, user);
  },

  /**
   * Generates and downloads the PDF Payment History directly in browser
   */
  downloadPaymentHistoryPDF: async (payments: any[], user: User | null): Promise<void> => {
    generatePaymentHistoryPdf(payments, user);
  },

  /**
   * Generates and downloads the PDF Tax Invoice directly in browser
   */
  downloadTaxInvoicePDF: async (data: CustomerBillingSummary, user: User | null): Promise<void> => {
    generateTaxInvoicePdf(data, user);
  },

  /**
   * Generates and downloads the PDF Payment Receipt directly in browser
   */
  downloadReceiptsPDF: async (
    data: CustomerBillingSummary,
    user: User | null
  ): Promise<{ success: boolean; message?: string }> => {
    return generatePaymentReceiptPdf(data, user);
  },
};
