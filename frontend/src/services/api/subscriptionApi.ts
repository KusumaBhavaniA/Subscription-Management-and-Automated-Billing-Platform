import { ApiResponse } from './authApi';

export interface SubscriptionActionPayload {
  customerId: string;
  planId: string;
  billingCycle?: 'monthly' | 'yearly';
}

export const subscriptionApi = {
  /**
   * Frontend mock subscription plan upgrade
   */
  upgradePlan: async (payload: SubscriptionActionPayload): Promise<ApiResponse<{ currentPlan: string }>> => {
    return {
      success: true,
      message: `Successfully upgraded subscription plan to ${payload.planId}.`,
      data: { currentPlan: payload.planId },
    };
  },

  /**
   * Frontend mock subscription plan downgrade
   */
  downgradePlan: async (payload: SubscriptionActionPayload): Promise<ApiResponse<{ currentPlan: string }>> => {
    return {
      success: true,
      message: `Plan downgrade scheduled to take effect at end of current billing cycle.`,
      data: { currentPlan: payload.planId },
    };
  },

  /**
   * Frontend mock subscription cancellation
   */
  cancelSubscription: async (payload: { customerId: string; reason?: string }): Promise<ApiResponse<{ status: string }>> => {
    return {
      success: true,
      message: 'Subscription has been cancelled.',
      data: { status: 'Cancelled' },
    };
  },
};
