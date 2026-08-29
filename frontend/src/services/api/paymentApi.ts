import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';
import { subscriptionManagementApi } from './subscriptionManagementApi';
import { BillingCycle } from '../../types/subscription';
import { getPaymentTransactions } from '../../utils/paymentData';
import { Invoice } from '../../types/invoice';
import { INITIAL_INVOICES } from '../mockDataService';

export interface PaymentOrderRequest {
  planId?: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  subtotal: number;
  gst: number;
  discount: number;
  couponCode?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  billingAddress: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  paymentMethod: 'upi' | 'credit-card' | 'debit-card' | 'net-banking' | 'wallet' | 'demo';
  paymentDetails?: any;
}

export interface PaymentTransactionResult {
  success: boolean;
  isAuthError?: boolean;
  transactionId: string;
  invoiceId?: string;
  paymentDate: string;
  amountPaid: number;
  planName: string;
  billingCycle: BillingCycle;
  customerName: string;
  customerEmail: string;
  failureReason?: string;
  emailStatus?: string;
}

export interface CouponResult {
  code: string;
  discountType: 'percentage' | 'flat';
  value: number; // e.g. 10 for 10% or 500 for ₹500
  description: string;
}

const DUMMY_COUPONS: Record<string, CouponResult> = {
  WELCOME10: {
    code: 'WELCOME10',
    discountType: 'percentage',
    value: 10,
    description: '10% Welcome Discount applied!',
  },
  SAVE20: {
    code: 'SAVE20',
    discountType: 'percentage',
    value: 20,
    description: '20% Mega Savings Discount applied!',
  },
  NEWUSER: {
    code: 'NEWUSER',
    discountType: 'flat',
    value: 500,
    description: '₹500 New User Instant Cash Discount applied!',
  },
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

export const paymentApi = {
  /**
   * Get supported payment methods for frontend rendering
   */
  getPaymentMethods: async () => {
    return [
      { id: 'upi', label: 'UPI Payment', description: 'Google Pay, PhonePe, Paytm & UPI ID' },
      { id: 'credit-card', label: 'Credit Card', description: 'Visa, MasterCard, Amex, RuPay' },
      { id: 'debit-card', label: 'Debit Card', description: 'All Indian & International Banks' },
      { id: 'net-banking', label: 'Net Banking', description: 'SBI, HDFC, ICICI, Axis & 50+ Banks' },
      { id: 'wallet', label: 'Wallets', description: 'PhonePe, Paytm, Amazon Pay & More' },
      { id: 'demo', label: 'Demo Payment', description: 'Test the complete payment and billing workflow', isTestMode: true },
    ];
  },

  /**
   * Validate and apply coupon code (Frontend mock API)
   */
  applyCoupon: async (couponCode: string): Promise<CouponResult> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const upperCode = couponCode.trim().toUpperCase();
    if (DUMMY_COUPONS[upperCode]) {
      return DUMMY_COUPONS[upperCode];
    }
    throw new Error('Invalid coupon code. Please try WELCOME10, SAVE20, or NEWUSER.');
  },

  /**
   * Get customer profile & billing info for pre-filling fields
   */
  getCustomerBilling: async (email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const users = getItem<any[]>('users', []);
    const found = users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
    return {
      name: found?.fullName || found?.name || 'Valued Customer',
      email: email || 'customer@example.com',
      phone: found?.phone || '+91 98765 43210',
      billingAddress: {
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        zipCode: '400001',
      },
    };
  },

  /**
   * Create payment order (Backend simulation ready)
   */
  createPaymentOrder: async (orderData: PaymentOrderRequest) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const orderId = `ORD-${Date.now()}`;
    return {
      orderId,
      amount: orderData.amount,
      currency: 'INR',
      status: 'created',
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Verify and process transaction via backend API
   */
  verifyPayment: async (
    orderData: PaymentOrderRequest,
    shouldFail: boolean = false,
    shouldCancel: boolean = false
  ): Promise<PaymentTransactionResult> => {
    const token = getAuthToken();
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      const res = await fetch('http://localhost:8000/billing/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_name: orderData.planName,
          billing_cycle: orderData.billingCycle,
          amount: orderData.amount,
          payment_method: orderData.paymentMethod,
          simulate_failure: shouldFail,
          simulate_cancel: shouldCancel,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
        }),
      });

      if (res.status === 401) {
        return {
          success: false,
          isAuthError: true,
          transactionId: `TXN-${Date.now()}`,
          paymentDate: dateStr,
          amountPaid: orderData.amount,
          planName: orderData.planName,
          billingCycle: orderData.billingCycle,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          failureReason: 'Your session has expired. Please log in again.',
        };
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          transactionId: data.transactionId || `TXN-${Date.now()}`,
          paymentDate: dateStr,
          amountPaid: orderData.amount,
          planName: orderData.planName,
          billingCycle: orderData.billingCycle,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          failureReason: data.failure_reason || data.message || 'Payment was not completed.',
        };
      }

      // Sync local storage mirror
      const invoiceNumber = data.invoiceId || `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        amount: orderData.amount,
        status: 'Paid',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        items: [
          {
            id: `item-${Date.now()}`,
            description: `${orderData.planName} (${orderData.billingCycle}) Subscription`,
            quantity: 1,
            unitPrice: orderData.amount,
            amount: orderData.amount,
          },
        ],
      };
      const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
      setItem(STORAGE_KEYS.INVOICES, [newInvoice, ...invoices]);

      const history = getItem<any[]>(STORAGE_KEYS.PAYMENTS || 'payments_history', []);
      const newTxn = {
        id: data.transactionId || `TXN-${Date.now()}`,
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        planName: orderData.planName,
        billingCycle: orderData.billingCycle,
        amount: orderData.amount,
        amountPaid: orderData.amount,
        status: 'Success',
        paymentMethod: orderData.paymentMethod === 'demo' ? 'DEMO PAYMENT' : orderData.paymentMethod.toUpperCase(),
        date: dateStr,
        invoiceId: invoiceNumber,
      };
      setItem(STORAGE_KEYS.PAYMENTS || 'payments_history', [newTxn, ...history]);

      return {
        success: true,
        transactionId: data.transactionId || newTxn.id,
        invoiceId: invoiceNumber,
        paymentDate: dateStr,
        amountPaid: orderData.amount,
        planName: orderData.planName,
        billingCycle: orderData.billingCycle,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        emailStatus: `Invoice email sent to: ${orderData.customerEmail}`,
      };
    } catch (err: any) {
      console.warn('Backend payment endpoint error:', err);
      return {
        success: false,
        transactionId: `TXN-${Date.now()}`,
        paymentDate: dateStr,
        amountPaid: orderData.amount,
        planName: orderData.planName,
        billingCycle: orderData.billingCycle,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        failureReason: err.message || 'Payment processing error.',
      };
    }
  },

  /**
   * Get payment transactions for authenticated user from backend DB
   */
  getPaymentTransactions: async (email: string, role?: string) => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/payments/me', {
        headers: {
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
    const history = getPaymentTransactions();
    const cleanEmail = email.trim().toLowerCase();
    return role === 'Admin' ? history : history.filter((t) => t.customerEmail?.toLowerCase() === cleanEmail);
  },

  /**
   * Generate and download PDF invoice placeholder for transaction
   */
  downloadInvoice: (txn: {
    transactionId: string;
    customerName: string;
    customerEmail: string;
    planName: string;
    billingCycle: string;
    amountPaid: number;
    paymentDate: string;
  }) => {
    const invoiceContent = `
===================================================================
             NEXFLOW — SUBSCRIPTION & BILLING PLATFORM
                         OFFICIAL INVOICE
===================================================================
Invoice Number: INV-${txn.transactionId}
Transaction ID: ${txn.transactionId}
Date:           ${txn.paymentDate}
Status:         PAID

CUSTOMER DETAILS:
-------------------------------------------------------------------
Name:  ${txn.customerName}
Email: ${txn.customerEmail}

SUBSCRIPTION DETAILS:
-------------------------------------------------------------------
Plan Name:         ${txn.planName}
Billing Cycle:     ${txn.billingCycle}
Amount Paid:       ₹${txn.amountPaid.toLocaleString('en-IN')}
GST (10% Included): ₹${Math.round(txn.amountPaid - txn.amountPaid / 1.10).toLocaleString('en-IN')}

===================================================================
          Thank you for subscribing to our platform!
===================================================================
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${txn.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
