import { Invoice } from '../types/invoice';
import { Customer } from '../types/customer';
import { Subscription } from '../types/subscription';
import { Plan } from '../types/plan';
import { NotificationItem } from '../types/notification';
import { STORAGE_KEYS, getItem, setItem } from '../utils/storage';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Tier',
    description: 'Perfect for small startups and solo founders building initial MRR.',
    priceMonthly: 1999,
    priceYearly: 19990,
    features: ['Up to 500 Active Customers', 'Automated Invoicing & Tax', 'Standard REST API Access', 'Email Support (24h)'],
    activeSubscribers: 142,
  },
  {
    id: 'plan-pro',
    name: 'Pro Business',
    description: 'For growing businesses requiring multi-currency and churn protection.',
    priceMonthly: 4999,
    priceYearly: 49990,
    features: ['Up to 5,000 Active Customers', 'Advanced Revenue Analytics', 'Custom Payment Gateways', 'Priority 24/7 Support', 'Webhook Integrations'],
    isPopular: true,
    activeSubscribers: 389,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Scale',
    description: 'Unlimited capacity with dedicated SLA, custom contracts, and audit logs.',
    priceMonthly: 14999,
    priceYearly: 149990,
    features: ['Unlimited Customers', 'Dedicated Account Manager', 'Custom Database SLA (99.99%)', 'Custom SAML & SSO', 'Custom Security Compliance'],
    activeSubscribers: 64,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@techcorp.in',
    phone: '+91 9876543210',
    status: 'Active',
    subscriptionPlan: 'Pro Business',
    mrr: 4999,
    totalSpent: 59988,
    joinedDate: '2025-11-15',
    country: 'India',
  },
  {
    id: 'cust-2',
    name: 'Priya Sundaram',
    email: 'priya@datasolutions.com',
    phone: '+91 9812345678',
    status: 'Active',
    subscriptionPlan: 'Enterprise Scale',
    mrr: 14999,
    totalSpent: 179988,
    joinedDate: '2025-08-20',
    country: 'India',
  },
  {
    id: 'cust-3',
    name: 'Aarav Mehta',
    email: 'aarav@cloudnexus.io',
    phone: '+91 9988776655',
    status: 'Active',
    subscriptionPlan: 'Starter Tier',
    mrr: 1999,
    totalSpent: 11994,
    joinedDate: '2026-01-10',
    country: 'India',
  },
  {
    id: 'cust-4',
    name: 'Ananya Verma',
    email: 'ananya@designcraft.co',
    phone: '+91 9765432109',
    status: 'Inactive',
    subscriptionPlan: 'Starter Tier',
    mrr: 0,
    totalSpent: 5997,
    joinedDate: '2025-10-01',
    country: 'India',
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Priya Sundaram',
    customerEmail: 'priya@datasolutions.com',
    amount: 14999,
    status: 'Paid',
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    items: [
      { id: 'item-1', description: 'Enterprise Scale Subscription - July 2026', quantity: 1, unitPrice: 14999, amount: 14999 }
    ]
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-002',
    customerName: 'Rohan Sharma',
    customerEmail: 'rohan.sharma@techcorp.in',
    amount: 4999,
    status: 'Paid',
    issueDate: '2026-07-05',
    dueDate: '2026-07-20',
    items: [
      { id: 'item-2', description: 'Pro Business Monthly Subscription - July 2026', quantity: 1, unitPrice: 4999, amount: 4999 }
    ]
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav@cloudnexus.io',
    amount: 1999,
    status: 'Pending',
    issueDate: '2026-07-25',
    dueDate: '2026-08-05',
    items: [
      { id: 'item-3', description: 'Starter Tier Monthly Plan', quantity: 1, unitPrice: 1999, amount: 1999 }
    ]
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'INV-2026-004',
    customerName: 'Ananya Verma',
    customerEmail: 'ananya@designcraft.co',
    amount: 1999,
    status: 'Overdue',
    issueDate: '2026-06-15',
    dueDate: '2026-06-30',
    items: [
      { id: 'item-4', description: 'Starter Tier Subscription Renewal', quantity: 1, unitPrice: 1999, amount: 1999 }
    ]
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    customerName: 'Priya Sundaram',
    customerEmail: 'priya@datasolutions.com',
    planName: 'Enterprise Scale',
    status: 'Active',
    billingCycle: 'Monthly',
    amount: 14999,
    startDate: '2025-08-20',
    nextBillingDate: '2026-08-20',
  },
  {
    id: 'sub-2',
    customerName: 'Rohan Sharma',
    customerEmail: 'rohan.sharma@techcorp.in',
    planName: 'Pro Business',
    status: 'Active',
    billingCycle: 'Monthly',
    amount: 4999,
    startDate: '2025-11-15',
    nextBillingDate: '2026-08-15',
  },
  {
    id: 'sub-3',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav@cloudnexus.io',
    planName: 'Starter Tier',
    status: 'Active',
    billingCycle: 'Monthly',
    amount: 1999,
    startDate: '2026-01-10',
    nextBillingDate: '2026-08-10',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Payment Successful',
    message: 'Payment of ₹14,999 from Priya Sundaram processed via Stripe.',
    timestamp: '10 mins ago',
    isRead: false,
    type: 'success',
  },
  {
    id: 'notif-2',
    title: 'Invoice Paid',
    message: 'Invoice #INV-2026-002 has been marked as Paid by Rohan Sharma.',
    timestamp: '1 hour ago',
    isRead: false,
    type: 'success',
  },
  {
    id: 'notif-3',
    title: 'Subscription Expiring',
    message: 'Aarav Mehta starter tier plan will renew in 3 days.',
    timestamp: '5 hours ago',
    isRead: false,
    type: 'warning',
  },
  {
    id: 'notif-4',
    title: 'Payment Failed',
    message: 'Payment attempt failed for Ananya Verma (Card Expired).',
    timestamp: '1 day ago',
    isRead: true,
    type: 'error',
  },
  {
    id: 'notif-5',
    title: 'Subscription Renewed',
    message: 'Pro Business subscription automatically renewed for TechCorp.',
    timestamp: '2 days ago',
    isRead: true,
    type: 'info',
  },
];

export const initializeMockData = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    setItem(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
};
