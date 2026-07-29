export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Past Due' | 'Trial';
export type BillingCycle = 'Monthly' | 'Yearly';

export interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;
  startDate: string;
  nextBillingDate: string;
}
