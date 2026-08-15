export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';

export interface PaymentTransaction {
  id: string; // e.g. "TXN-2026-000001"
  customerId: string; // e.g. "CUS-2026-000001"
  customerName: string; // e.g. "Aneesh Vojjala"
  customerEmail: string; // e.g. "aneesh@example.com"
  customerMobile?: string; // e.g. "+91 98765 43210"
  amount: number; // e.g. 4999
  gateway: string; // e.g. "Razorpay" | "Stripe" | "PayPal"
  method: string; // e.g. "UPI" | "Credit Card" | "Net Banking"
  status: PaymentStatus; // "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING"
  date: string; // "YYYY-MM-DD" e.g. "2026-08-15"
  time: string; // "10:42 AM"
  plan: string; // "Pro Business"
  invoiceId: string; // "INV-2026-000001"
}
