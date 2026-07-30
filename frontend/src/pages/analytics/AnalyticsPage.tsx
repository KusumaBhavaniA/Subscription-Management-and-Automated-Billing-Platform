import React from 'react';
import { PieChart, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary" />
            SaaS Financial Analytics
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Deep dive into MRR growth velocity, subscriber LTV, and churn statistics.
          </p>
        </div>
        <Badge variant="brand">Admin Analytics</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase">Average Revenue Per User (ARPU)</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">₹ 7,332</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+6.4% this quarter</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase">Customer Lifetime Value (LTV)</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">₹ 87,984</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.1% growth</span>
            </div>
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mutedText uppercase">Gross Churn Rate</span>
            <Users className="w-4 h-4 text-danger" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-heading">1.2%</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-bold mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-0.4% improvement</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-heading mb-4">Revenue Breakdown by Tier</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-primaryText">Enterprise Scale (64 accounts)</span>
              <span className="text-primary font-extrabold">₹ 9,59,936 / mo (65%)</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[65%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-primaryText">Pro Business Tier (389 accounts)</span>
              <span className="text-primary font-extrabold">₹ 19,44,611 / mo (28%)</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary/80 w-[28%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-primaryText">Starter Tier (142 accounts)</span>
              <span className="text-primary font-extrabold">₹ 2,83,858 / mo (7%)</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 w-[7%]" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
