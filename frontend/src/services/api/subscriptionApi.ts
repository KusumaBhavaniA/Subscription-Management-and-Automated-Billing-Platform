import { ApiResponse } from './authApi';

/**
 * FASTAPI BACKEND SUBSCRIPTION API PLACEHOLDERS
 * 
 * Production FastAPI Endpoints Contract:
 * - POST /api/subscriptions/upgrade
 * - POST /api/subscriptions/downgrade
 * - POST /api/subscriptions/cancel
 * 
 * Frontend only handles UI interactions and API placeholders.
 * Subscription logic and billing calculations are processed by the FastAPI backend team.
 */

export interface SubscriptionActionPayload {
  customerId: string;
  planId: string;
  billingCycle?: 'monthly' | 'yearly';
}

export const subscriptionApi = {
  /**
   * Endpoint: POST /api/subscriptions/upgrade
   * Backend handles plan upgrade logic and prorated billing recalculation.
   */
  upgradePlan: async (payload: SubscriptionActionPayload): Promise<ApiResponse<{ currentPlan: string }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/subscriptions/upgrade', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: `Successfully upgraded subscription plan to ${payload.planId}.`,
      data: { currentPlan: payload.planId },
    };
  },

  /**
   * Endpoint: POST /api/subscriptions/downgrade
   * Backend handles plan downgrade logic at period end.
   */
  downgradePlan: async (payload: SubscriptionActionPayload): Promise<ApiResponse<{ currentPlan: string }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/subscriptions/downgrade', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: `Plan downgrade scheduled to take effect at end of current billing cycle.`,
      data: { currentPlan: payload.planId },
    };
  },

  /**
   * Endpoint: POST /api/subscriptions/cancel
   * Backend sets cancellation flag and retains access until billing cycle expiration.
   */
  cancelSubscription: async (payload: { customerId: string; reason?: string }): Promise<ApiResponse<{ status: string }>> => {
    // FastAPI Backend Integration Point:
    // const response = await fetch('/api/subscriptions/cancel', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return await response.json();

    return {
      success: true,
      message: 'Subscription has been cancelled.',
      data: { status: 'Cancelled' },
    };
  },
};
