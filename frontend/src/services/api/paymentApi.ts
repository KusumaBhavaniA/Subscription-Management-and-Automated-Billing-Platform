import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';
import { subscriptionManagementApi } from './subscriptionManagementApi';
import { BillingCycle } from '../../types/subscription';

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
  paymentMethod: 'upi' | 'credit-card' | 'debit-card' | 'net-banking' | 'wallet';
  paymentDetails?: any;
}

export interface PaymentTransactionResult {
  success: boolean;
  transactionId: string;
  paymentDate: string;
  amountPaid: number;
  planName: string;
  billingCycle: BillingCycle;
  customerName: string;
  customerEmail: string;
  failureReason?: string;
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
   * Verify and process transaction (Simulates 2-3s processing done in UI)
   */
  verifyPayment: async (
    orderData: PaymentOrderRequest,
    shouldFail: boolean = false
  ): Promise<PaymentTransactionResult> => {
    // Simulate backend payment gateway API call
    await new Promise((resolve) => setTimeout(resolve, 200));

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const txnId = `TXN-${new Date().toISOString().replace(/[-:T shadow.Z]/g, '').slice(0, 12)}`;

    if (shouldFail) {
      return {
        success: false,
        transactionId: txnId,
        paymentDate: dateStr,
        amountPaid: orderData.amount,
        planName: orderData.planName,
        billingCycle: orderData.billingCycle,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        failureReason: 'Bank Timeout - Issuing bank server did not respond.',
      };
    }

    // On Success: Assign subscription in state
    await subscriptionManagementApi.assignSubscription(
      orderData.customerEmail,
      orderData.customerName,
      orderData.planName,
      orderData.billingCycle
    );

    // Save transaction to local storage history
    const history = getItem<any[]>(STORAGE_KEYS.PAYMENTS || 'payments_history', []);
    const newTxn = {
      id: txnId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      planName: orderData.planName,
      billingCycle: orderData.billingCycle,
      amount: orderData.amount,
      status: 'Success',
      paymentMethod: orderData.paymentMethod.toUpperCase(),
      date: dateStr,
    };
    setItem(STORAGE_KEYS.PAYMENTS || 'payments_history', [newTxn, ...history]);

    return {
      success: true,
      transactionId: txnId,
      paymentDate: dateStr,
      amountPaid: orderData.amount,
      planName: orderData.planName,
      billingCycle: orderData.billingCycle,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
    };
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
                   AUTOMATED BILLING PLATFORM
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
GST (18% Included): ₹${Math.round(txn.amountPaid - txn.amountPaid / 1.18).toLocaleString('en-IN')}

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
