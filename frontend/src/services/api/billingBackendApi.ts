import { authService } from '../authService';
import { apiFetch } from './client';

/**
 * Client for the REAL FastAPI billing backend (app/billing).
 *
 * Kept separate from billingApi.ts / planApi.ts / subscriptionApi.ts,
 * which still run on local mock data for the rest of the app's UI.
 * This file talks to the actual proration + invoice engine.
 */

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  message: string;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const session = authService.getCurrentSession();
  try {
    const response = await apiFetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (body && (typeof body.detail === 'string' ? body.detail : body.message)) || 'Request failed.';
      return { success: false, message };
    }

    return { success: true, data: body as T, message: 'OK' };
  } catch {
    return {
      success: false,
      message: 'Unable to reach the backend. Ensure backend2 is running on port 8000.',
    };
  }
};

export interface BillingPlan {
  id: number;
  code: string;
  name: string;
  monthly_price: string;
  currency: string;
  is_active: boolean;
}

export interface BillingSubscription {
  id: number;
  user_id: number;
  plan: BillingPlan;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface ProrationPreview {
  old_plan_name: string;
  old_plan_price: string;
  new_plan_name: string;
  new_plan_price: string;
  days_in_cycle: number;
  days_used: number;
  days_remaining: number;
  unused_credit: string;
  new_plan_charge: string;
  net_amount: string;
}

export interface BillingInvoiceLineItem {
  id: number;
  item_type: string;
  description: string;
  quantity: string;
  unit_amount: string;
  amount: string;
}

export interface BillingInvoice {
  id: number;
  invoice_number: string;
  subscription_id: number;
  status: string;
  currency: string;
  period_start: string;
  period_end: string;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  issued_at: string;
  due_at: string | null;
  line_items: BillingInvoiceLineItem[];
}

export const billingBackendApi = {
  getPlans: () => request<BillingPlan[]>('/billing/plans'),

  getMySubscription: () => request<BillingSubscription>('/billing/subscriptions/me'),

  previewProration: (subscriptionId: number, newPlanCode: string) =>
    request<ProrationPreview>(`/billing/subscriptions/${subscriptionId}/proration-preview`, {
      method: 'POST',
      body: JSON.stringify({ new_plan_code: newPlanCode }),
    }),

  upgrade: (subscriptionId: number, newPlanCode: string) =>
    request<BillingInvoice>(`/billing/subscriptions/${subscriptionId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ new_plan_code: newPlanCode }),
    }),

  listInvoices: () => request<BillingInvoice[]>('/billing/invoices'),
};
