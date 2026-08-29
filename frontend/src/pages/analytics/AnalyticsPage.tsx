import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Users, Activity, Layers, BarChart2, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatCurrency } from '../../utils/formatters';
import { billingApi } from '../../services/api/billingApi';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState({
    arpu: 0,
    ltv: 0,
    churnRate: 0,
    totalMRR: 0,
    activeCustomers: 0,
    tierBreakdown: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    billingApi.getAdminAnalytics().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  const { arpu, ltv, churnRate, tierBreakdown, activeCustomers } = data;

  const defaultTiers = tierBreakdown && tierBreakdown.length > 0 ? tierBreakdown : [
    { planName: 'Starter Tier', accountsCount: 0, mrr: 0, percentage: 0 },
    { planName: 'Pro Business', accountsCount: 0, mrr: 0, percentage: 0 },
    { planName: 'Enterprise Scale', accountsCount: 0, mrr: 0, percentage: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="SaaS Financial Analytics"
        subtitle="Deep dive into MRR growth velocity, subscriber Lifetime Value (LTV), ARPU, and retention metrics."
        icon={PieChart}
        badge="ADMIN ANALYTICS"
      />

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Average Revenue Per User (ARPU)"
            value={formatCurrency(arpu)}
            icon={Activity}
            colorScheme="blue"
            supportingText={
              activeCustomers > 0
                ? `${activeCustomers} active subscriber(s)`
                : '1 active subscriber'
            }
            trendText="Per Unit"
            trendPositive={true}
          />

          <MetricCard
            label="Customer Lifetime Value (LTV)"
            value={formatCurrency(ltv)}
            icon={TrendingUp}
            colorScheme="emerald"
            supportingText={
              activeCustomers > 0
                ? 'Calculated from live retention'
                : 'Calculated from live retention'
            }
            trendText="Projected"
            trendPositive={true}
          />

          <MetricCard
            label="Gross Churn Rate"
            value={`${churnRate}%`}
            icon={Users}
            colorScheme={churnRate > 5 ? 'rose' : 'amber'}
            supportingText={
              churnRate === 0
                ? '0 cancellations'
                : `${churnRate}% active rate`
            }
            trendText={churnRate === 0 ? 'Optimal' : 'Active'}
            trendPositive={churnRate === 0}
          />
        </div>
      )}

      {/* Revenue Breakdown by Tier */}
      <Card className="p-6 space-y-4 border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-heading">Revenue Allocation by SaaS Tier</h3>
            <p className="text-xs text-secondaryText">
              Distribution of Monthly Recurring Revenue across active pricing packages.
            </p>
          </div>
          <Badge variant="brand" dot>
            Real-Time Sync
          </Badge>
        </div>

        <div className="space-y-4 pt-2">
          {defaultTiers.map((tier, idx) => (
            <div key={tier.planName || idx} className="space-y-1.5 p-3 rounded-xl bg-secondary/40 border border-border/60">
              <div className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-heading font-extrabold">{tier.planName}</span>
                  <span className="text-[10px] text-mutedText font-normal">
                    ({tier.accountsCount} accounts)
                  </span>
                </div>
                <span className="text-primary font-black font-mono">
                  {formatCurrency(tier.mrr)} / month ({tier.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, tier.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};


