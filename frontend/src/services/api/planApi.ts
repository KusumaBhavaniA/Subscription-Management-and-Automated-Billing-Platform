import { Plan } from '../../types/plan';
import { STORAGE_KEYS, getItem, setItem } from '../../utils/storage';
import { INITIAL_PLANS } from '../mockDataService';

export interface PlanPayload {
  name: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  features: string[];
  maxCustomers?: string;
  storage?: string;
  apiAccess?: string;
  supportLevel?: string;
  isEnabled?: boolean;
  isPopular?: boolean;
}

export const planApi = {
  getPlans: async (): Promise<Plan[]> => {
    try {
      const res = await fetch('http://localhost:8000/plans');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
          return data.plans as Plan[];
        }
      }
    } catch (e) {
      console.warn('GET /plans error:', e);
    }
    return getItem<Plan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  },

  getPlanDetails: async (planId: string): Promise<Plan | null> => {
    const list = await planApi.getPlans();
    return list.find((p) => p.id === planId || (p as any).dbId === planId) || null;
  },

  createPlan: async (payload: PlanPayload): Promise<Plan> => {
    const list = await planApi.getPlans();
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: payload.name.trim(),
      description: payload.description.trim(),
      priceMonthly: payload.priceMonthly,
      priceQuarterly: payload.priceQuarterly,
      priceYearly: payload.priceYearly,
      features: payload.features,
      maxCustomers: payload.maxCustomers || '1,000 Customers',
      storage: payload.storage || '50 GB Storage',
      apiAccess: payload.apiAccess || 'Standard REST API',
      supportLevel: payload.supportLevel || '24/7 Email Support',
      isEnabled: payload.isEnabled !== undefined ? payload.isEnabled : true,
      isPopular: payload.isPopular || false,
      activeSubscribers: 0,
    };
    list.push(newPlan);
    setItem(STORAGE_KEYS.PLANS, list);
    return newPlan;
  },

  updatePlan: async (planId: string, payload: Partial<PlanPayload>): Promise<Plan> => {
    const list = await planApi.getPlans();
    const idx = list.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Plan not found');

    const updated = {
      ...list[idx],
      ...payload,
      name: payload.name ? payload.name.trim() : list[idx].name,
      description: payload.description ? payload.description.trim() : list[idx].description,
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.PLANS, list);
    return updated;
  },

  toggleEnablePlan: async (planId: string): Promise<Plan> => {
    const list = await planApi.getPlans();
    const idx = list.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Plan not found');

    const currentStatus = list[idx].isEnabled !== undefined ? list[idx].isEnabled : true;
    list[idx].isEnabled = !currentStatus;
    setItem(STORAGE_KEYS.PLANS, list);
    return list[idx];
  },

  deletePlan: async (planId: string): Promise<boolean> => {
    const list = await planApi.getPlans();
    const filtered = list.filter((p) => p.id !== planId);
    setItem(STORAGE_KEYS.PLANS, filtered);
    return true;
  },
};
