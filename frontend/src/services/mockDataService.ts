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
    priceQuarterly: 5399,
    priceYearly: 19990,
    features: ['Automated Invoicing & Tax', 'Standard Revenue Dashboards', 'Standard Webhook Triggers'],
    activeSubscribers: 142,
    maxCustomers: '500 Customers',
    storage: '10 GB Cloud Storage',
    apiAccess: 'Standard REST API (1,000 req/min)',
    supportLevel: 'Email Support (24h SLA)',
    isEnabled: true,
  },
  {
    id: 'plan-pro',
    name: 'Pro Business',
    description: 'For growing businesses requiring multi-currency and churn protection.',
    priceMonthly: 4999,
    priceQuarterly: 13499,
    priceYearly: 49990,
    features: ['Advanced Revenue Analytics', 'Custom Payment Gateways', 'Webhook Integrations', 'Multi-currency Conversion'],
    isPopular: true,
    activeSubscribers: 389,
    maxCustomers: '5,000 Customers',
    storage: '100 GB Cloud Storage',
    apiAccess: 'Full REST API + Webhooks (10,000 req/min)',
    supportLevel: 'Priority 24/7 Support (2h SLA)',
    isEnabled: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Scale',
    description: 'Unlimited capacity with dedicated SLA, custom contracts, and audit logs.',
    priceMonthly: 14999,
    priceQuarterly: 40499,
    priceYearly: 149990,
    features: ['Dedicated Account Manager', 'Custom Database SLA (99.99%)', 'Custom SAML & SSO', 'Custom Security Compliance'],
    activeSubscribers: 64,
    maxCustomers: 'Unlimited Customers',
    storage: '1 TB High-Speed Storage',
    apiAccess: 'Dedicated API Rate Limit & Custom Endpoint',
    supportLevel: 'Dedicated SLA Account Specialist (15m SLA)',
    isEnabled: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const purgeLegacyMockData = (): void => {
  try {
    // Purge legacy mock payments
    const payments = getItem<any[]>(STORAGE_KEYS.PAYMENTS, []);
    if (payments && payments.some((p) => p.customerName === 'Aneesh Vojjala' || p.customerName === 'Janith Upadhyay')) {
      setItem(STORAGE_KEYS.PAYMENTS, []);
    }

    // Purge legacy mock tickets
    const tickets = getItem<any[]>(STORAGE_KEYS.TICKETS, []);
    if (tickets && tickets.some((t) => t.customerName === 'Rohan Sharma' || t.id === 'TCK-2026-001')) {
      setItem(STORAGE_KEYS.TICKETS, []);
    }

    // Purge legacy mock customers
    const customers = getItem<any[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (customers && customers.some((c) => c.name === 'Janith Upadhyay' || c.customerId === 'CUS-2026-001')) {
      setItem(STORAGE_KEYS.CUSTOMERS, []);
    }

    // Purge legacy mock subscriptions
    const subscriptions = getItem<any[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    if (subscriptions && subscriptions.some((s) => s.customerEmail === 'janith@example.com' || s.id === 'sub-1')) {
      setItem(STORAGE_KEYS.SUBSCRIPTIONS, []);
    }
  } catch (e) {
    console.warn('purgeLegacyMockData error:', e);
  }
};

export const initializeMockData = (): void => {
  purgeLegacyMockData();
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    setItem(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setItem(STORAGE_KEYS.CUSTOMERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
    setItem(STORAGE_KEYS.INVOICES, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, []);
  }
};


