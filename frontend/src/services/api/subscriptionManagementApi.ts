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

const getPlanPrice = (planName: string, cycle: BillingCycle) => {
  const info = PLAN_PRICES[planName] || { monthly: 4999, quarterly: 13499, yearly: 49990 };
  if (cycle === 'Monthly') return info.monthly;
  if (cycle === 'Quarterly') return info.quarterly;
  return info.yearly;
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

export const subscriptionManagementApi = {
  getSubscriptions: async (): Promise<Subscription[]> => {
    return getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
  },

  getSubscriptionByEmail: async (email: string): Promise<Subscription | null> => {
    if (!email) return null;
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
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
    const authSession = getItem<StoredUser | null>(STORAGE_KEYS.AUTH, null);
    if (authSession && authSession.email.toLowerCase() === cleanEmail) {
      authSession.currentPlan = planName;
      authSession.subscriptionStatus = status;
      setItem(STORAGE_KEYS.AUTH, authSession);
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
   * Upgrade Subscription
   */
  upgradeSubscription: async (subscriptionId: string, targetPlan: string = 'Enterprise Scale'): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const idx = list.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) throw new Error('Subscription not found');

    const cycle = list[idx].billingCycle || 'Monthly';
    const price = getPlanPrice(targetPlan, cycle);
    const mrr = getPlanMonthlyMrr(targetPlan, cycle);

    list[idx].planName = targetPlan;
    list[idx].status = 'Active';
    list[idx].amount = price;

    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(list[idx].customerEmail, targetPlan, 'Active', mrr);
    pushNotification('Subscription Upgraded', `Your subscription was upgraded to ${targetPlan}.`, 'success');
    return list[idx];
  },

  /**
   * Downgrade Subscription
   */
  downgradeSubscription: async (subscriptionId: string, targetPlan: string = 'Starter Tier'): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const idx = list.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) throw new Error('Subscription not found');

    const cycle = list[idx].billingCycle || 'Monthly';
    const price = getPlanPrice(targetPlan, cycle);
    const mrr = getPlanMonthlyMrr(targetPlan, cycle);

    list[idx].planName = targetPlan;
    list[idx].status = 'Active';
    list[idx].amount = price;

    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(list[idx].customerEmail, targetPlan, 'Active', mrr);
    pushNotification('Subscription Downgraded', `Your subscription was downgraded to ${targetPlan}.`, 'warning');
    return list[idx];
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
   * Cancel Subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const list = getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
    const idx = list.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) throw new Error('Subscription not found');

    list[idx].status = 'Cancelled';
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);
    subscriptionManagementApi.syncCustomerRecord(list[idx].customerEmail, list[idx].planName, 'Cancelled', 0);
    pushNotification('Subscription Cancelled', `Your ${list[idx].planName} subscription has been cancelled.`, 'error');
    return list[idx];
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
