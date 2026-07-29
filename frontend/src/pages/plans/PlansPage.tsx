import React, { useState } from 'react';
import { Layers, Check } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Plan } from '../../types/plan';

export const PlansPage: React.FC = () => {
  const [plans] = useState<Plan[]>(() => getItem<Plan[]>(STORAGE_KEYS.PLANS, []));
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Subscription Pricing Plans
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Configure monthly and annual SaaS plans, feature tiers, and customer allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-secondary p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle('Monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'Monthly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('Yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'Yearly' ? 'bg-primary text-white shadow-sm' : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            Yearly <span className="text-[10px] text-success font-semibold">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'Monthly' ? plan.priceMonthly : plan.priceYearly;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 ${
                plan.isPopular ? 'border-primary shadow-md' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand">Most Popular</Badge>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-heading">{plan.name}</h3>
                  <p className="text-xs text-secondaryText mt-1 min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-heading">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs text-mutedText">/{billingCycle === 'Monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p className="text-[11px] text-primary font-bold mt-1">
                    {plan.activeSubscribers} active subscribers
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-secondaryText uppercase tracking-wider">Included Features</span>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-primaryText font-medium">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
