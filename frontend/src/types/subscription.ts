export type SubscriptionStatus = 'Active' | 'Inactive' | 'Expired' | 'Cancelled' | 'canceled';
export type BillingCycle = 'Monthly' | 'Quarterly' | 'Yearly';

export interface Subscription {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number; // MRR / Price
  startDate: string;
  nextBillingDate: string;
  cancelAtPeriodEnd?: boolean;
  cancel_at_period_end?: boolean;
  canceledAt?: string;
}
