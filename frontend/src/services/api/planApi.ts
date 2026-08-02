import { Plan } from '../../types/plan';
const BASE_URL = "http://127.0.0.1:8000";

export interface PlanPayload {
  name: string;
  description: string;
  priceMonthly: number;
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
    const response = await fetch(`${BASE_URL}/plans`);

    if (!response.ok) {
        throw new Error("Failed to fetch plans");
    }

    const plans = await response.json();

return plans.map((plan: any) => ({
    id: plan.id.toString(),
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.price,
    priceYearly: plan.price * 12,
    features: [],
    isPopular: false,
    activeSubscribers: 0,
    maxCustomers: "",
    storage: "",
    apiAccess: "",
    supportLevel: "",
    isEnabled: plan.active
}));
},
  createPlan: async (payload: PlanPayload): Promise<Plan> => {

    const response = await fetch(`${BASE_URL}/plans/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            price: payload.priceMonthly,
            currency: "INR",
            interval: "monthly",
            trial_days: 0,
            active: payload.isEnabled ?? true
        })
    });

    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create plan");
}

    const plan = await response.json();

return {
    id: plan.id.toString(),
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.price,
    priceYearly: plan.price * 12,
    features: [],
    isPopular: false,
    activeSubscribers: 0,
    maxCustomers: "",
    storage: "",
    apiAccess: "",
    supportLevel: "",
    isEnabled: plan.active
};
},

  updatePlan: async (planId: string, payload: Partial<PlanPayload>): Promise<Plan> => {

    const response = await fetch(`${BASE_URL}/plans/${planId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            price: payload.priceMonthly,
            currency: "INR",
            interval: "monthly",
            trial_days: 0,
            active: payload.isEnabled
        })
    });

    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update plan");
}

    const plan = await response.json();

return {
    id: plan.id.toString(),
    name: plan.name,
    description: plan.description,
    priceMonthly: plan.price,
    priceYearly: plan.price * 12,
    features: [],
    isPopular: false,
    activeSubscribers: 0,
    maxCustomers: "",
    storage: "",
    apiAccess: "",
    supportLevel: "",
    isEnabled: plan.active
};
},

  toggleEnablePlan: async (
    planId: string,
    isEnabled: boolean
): Promise<{ message: string }> => {

    const endpoint = isEnabled
        ? "deactivate"
        : "activate";

    const response = await fetch(
        `${BASE_URL}/plans/${planId}/${endpoint}`,
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to change status");
}

    return await response.json();
},

  deletePlan: async (planId: string): Promise<boolean> => {

    const response = await fetch(
        `${BASE_URL}/plans/${planId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete plan");
}

    return true;
},
}