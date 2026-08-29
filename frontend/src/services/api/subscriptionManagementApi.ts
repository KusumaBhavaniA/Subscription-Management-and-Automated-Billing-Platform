import { Subscription, SubscriptionStatus, BillingCycle } from '../../types/subscription';
import { Customer } from '../../types/customer';
import { StoredUser } from '../../services/authService';
import { NotificationItem, NotificationType } from '../../types/notification';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';
import { INITIAL_SUBSCRIPTIONS, INITIAL_NOTIFICATIONS } from '../mockDataService';

const PLAN_PRICES: Record<string, { monthly: number; quarterly: number; yearly: number }> = {
  'Starter Tier': { monthly: 1999, quarterly: 5399, yearly: 19990 },
  'Pro Business': { monthly: 4999, quarterly: 13499, yearly: 49990 },
  'Enterprise Scale': { monthly: 14999, quarterly: 40499, yearly: 149990 },
};

export const getPlanCyclePrice = (planName: string, cycle: 'Monthly' | 'Quarterly' | 'Yearly'): number => {
  const info = PLAN_PRICES[planName] || { monthly: 1999, quarterly: 5399, yearly: 19990 };
  return info[cycle.toLowerCase() as keyof typeof info] || info.monthly;
};

const getPlanPrice = (planName: string, cycle: BillingCycle) => {
  return getPlanCyclePrice(planName, cycle);
};

const getPlanMonthlyMrr = (planName: string, cycle: BillingCycle) => {
  const price = getPlanPrice(planName, cycle);
  if (cycle === 'Monthly') return price;
  if (cycle === 'Quarterly') return Math.round(price / 3);
  return Math.round(price / 12);
};

const calculateNextBillingDate = (cycle: BillingCycle) => {
  const nextBilling = new Date();
  if (cycle === 'Monthly') {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  } else if (cycle === 'Quarterly') {
    nextBilling.setMonth(nextBilling.getMonth() + 3);
  } else {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  }
  return nextBilling.toISOString().split('T')[0];
};

const pushNotification = (title: NotificationType, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const notifs = getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  notifs.unshift({
    id: `notif-${Date.now()}`,
    title,
    message,
    timestamp: 'Just now',
    isRead: false,
    type,
  });
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
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

export const subscriptionManagementApi = {
  getSubscriptions: async (): Promise<Subscription[]> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/admin/subscriptions', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.subscriptions)) {
          return data.subscriptions as Subscription[];
        }
      }
    } catch (e) {
      console.warn('GET /admin/subscriptions error:', e);
    }
    return getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
  },


  getMySubscription: async (): Promise<Subscription | null> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/subscriptions/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subscription) {
          return data.subscription as Subscription;
        }
      }
    } catch (e) {
      console.warn('GET /subscriptions/me error:', e);
    }
    return null;
  },

  getSubscriptionByEmail: async (email: string): Promise<Subscription | null> => {
    if (!email) return null;
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/subscriptions/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subscription) {
          return data.subscription as Subscription;
        }
      }
    } catch (e) {
      console.warn('GET /subscriptions/me error:', e);
    }
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
    return list.find((s) => s.customerEmail.toLowerCase() === email.toLowerCase()) || null;
  },


  /**
   * Sync customer record MRR & Subscription Status in storage & active session
   */
  syncCustomerRecord: (email: string, planName: string, status: SubscriptionStatus, mrr: number) => {
    const cleanEmail = email.toLowerCase();
    
    // Sync Customers list
    const customers = getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const cIdx = customers.findIndex((c) => c.email.toLowerCase() === cleanEmail);
    if (cIdx !== -1) {
      customers[cIdx].subscriptionPlan = planName;
      customers[cIdx].subscriptionStatus = status;
      customers[cIdx].mrr = status === 'Active' ? mrr : 0;
      setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Sync Users list
    const users = getItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const uIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (uIdx !== -1) {
      users[uIdx].currentPlan = planName;
      users[uIdx].subscriptionStatus = status;
      setItem(STORAGE_KEYS.USERS, users);
    }

    // Sync Active Auth session if logged in
    const authSession = getItem<any>(STORAGE_KEYS.AUTH, null);
    if (authSession) {
      const targetEmail = authSession.user?.email || authSession.email;
      if (targetEmail && targetEmail.toLowerCase() === cleanEmail) {
        if (authSession.user) {
          authSession.user.currentPlan = planName;
          authSession.user.subscriptionStatus = status;
        } else {
          authSession.currentPlan = planName;
          authSession.subscriptionStatus = status;
        }
        setItem(STORAGE_KEYS.AUTH, authSession);
      }
    }
  },

  /**
   * Assign Subscription to customer independently
   */
  assignSubscription: async (
    customerEmail: string,
    customerName: string,
    planName: string,
    billingCycle: BillingCycle = 'Monthly'
  ): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const price = getPlanPrice(planName, billingCycle);
    const mrr = getPlanMonthlyMrr(planName, billingCycle);

    const existingIdx = list.findIndex((s) => s.customerEmail.toLowerCase() === customerEmail.toLowerCase());

    const nextBillingDate = calculateNextBillingDate(billingCycle);

    const subObj: Subscription = {
      id: existingIdx !== -1 ? list[existingIdx].id : `sub-${Date.now()}`,
      customerName,
      customerEmail,
      planName,
      status: 'Active',
      billingCycle,
      amount: price,
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate,
    };

    if (existingIdx !== -1) {
      list[existingIdx] = subObj;
    } else {
      list.unshift(subObj);
    }

    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(customerEmail, planName, 'Active', mrr);
    pushNotification('Subscription Assigned', `Admin assigned you the ${planName} plan (${billingCycle}).`, 'success');
    return subObj;
  },

  /**
   * Calculate upgrade proration details
   */
  calculateUpgradeProration: (subscription: Subscription, targetPlan: string) => {
    const cycle = subscription.billingCycle || 'Monthly';
    const oldPrice = subscription.amount || getPlanPrice(subscription.planName, cycle);
    const newPrice = getPlanPrice(targetPlan, cycle);

    const startDate = new Date(subscription.startDate || Date.now());
    const endDate = new Date(subscription.nextBillingDate || Date.now() + 30 * 86400000);
    const now = new Date();

    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

    const unusedCredit = Math.round((oldPrice * daysRemaining) / totalDays);
    const newProratedCost = Math.round((newPrice * daysRemaining) / totalDays);
    const amountDueToday = Math.max(0, newProratedCost - unusedCredit);

    return {
      currentPlan: subscription.planName,
      currentPrice: oldPrice,
      targetPlan,
      targetPrice: newPrice,
      daysRemaining,
      totalDays,
      unusedCredit,
      newProratedCost,
      amountDueToday,
      nextRenewalAmount: newPrice,
    };
  },

  /**
   * Upgrade Subscription with Proration & Backend DB Update
   */
  upgradeSubscription: async (
    subscriptionId: string,
    targetPlan: string = 'Enterprise Scale',
    simulateFailure: boolean = false
  ): Promise<Subscription> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_plan_name: targetPlan,
          simulate_failure: simulateFailure,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upgrade payment failed. Current plan remains active.');
      }
    } catch (err: any) {
      console.warn('Backend upgrade API error:', err);
      throw err;
    }

    const sub = await subscriptionManagementApi.getSubscriptionByEmail(getItem<any>(STORAGE_KEYS.AUTH, null)?.user?.email || '');
    if (!sub) throw new Error('Upgrade process completed.');
    return sub;
  },

  /**
   * Downgrade Subscription via Backend DB
   */
  downgradeSubscription: async (subscriptionId: string, targetPlan: string = 'Starter Tier'): Promise<Subscription> => {
    const token = getAuthToken();
    try {
      const res = await fetch('http://localhost:8000/subscriptions/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_plan_name: targetPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Downgrade request failed.');
      }
    } catch (err: any) {
      console.warn('Backend downgrade API error:', err);
      throw err;
    }

    const sub = await subscriptionManagementApi.getSubscriptionByEmail(getItem<any>(STORAGE_KEYS.AUTH, null)?.user?.email || '');
    if (!sub) throw new Error('Downgrade completed.');
    return sub;
  },

  /**
   * Pause Subscription
   */
  pauseSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const idx = list.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) throw new Error('Subscription not found');

    list[idx].status = 'Inactive';
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(list[idx].customerEmail, list[idx].planName, 'Inactive', 0);
    pushNotification('Subscription Paused', `Your ${list[idx].planName} subscription has been paused.`, 'warning');
    return list[idx];
  },

  /**
   * Cancel Subscription with Prorated Refund via Backend DB
   */
  cancelSubscription: async (subscriptionId: string): Promise<{ subscription: Subscription; refundAmount: number }> => {
    const token = getAuthToken();
    let refundAmount = 0;
    try {
      const res = await fetch('http://localhost:8000/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: 'Customer cancellation',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = typeof data.detail === 'string' ? data.detail : (data.message || 'Cancellation request failed.');
        throw new Error(errorMsg);
      }
      refundAmount = data.refund_amount || 0;
    } catch (err: any) {
      console.warn('Backend cancel API error:', err);
      throw err;
    }

    const sub = await subscriptionManagementApi.getSubscriptionByEmail(getItem<any>(STORAGE_KEYS.AUTH, null)?.user?.email || '');
    return { subscription: sub || ({ status: 'Cancelled' } as any), refundAmount };
  },

  /**
   * Renew Subscription
   */
  renewSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const idx = list.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) throw new Error('Subscription not found');

    const cycle = list[idx].billingCycle || 'Monthly';
    const nextBillingDate = calculateNextBillingDate(cycle);
    const mrr = getPlanMonthlyMrr(list[idx].planName, cycle);

    list[idx].status = 'Active';
    list[idx].nextBillingDate = nextBillingDate;

    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(list[idx].customerEmail, list[idx].planName, 'Active', mrr);
    pushNotification('Subscription Renewed', `Your ${list[idx].planName} subscription has been renewed.`, 'success');
    return list[idx];
  },
};
