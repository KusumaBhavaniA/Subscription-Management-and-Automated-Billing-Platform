export type SubscriptionStatus = 'Active' | 'Inactive' | 'Expired' | 'Cancelled';
export type BillingCycle = 'Monthly' | 'Yearly';

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
}
