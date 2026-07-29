import React, { useState } from 'react';
import { CreditCard, Search } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getItem, STORAGE_KEYS } from '../../utils/storage';
import { Subscription } from '../../types/subscription';
import { useAuth } from '../../hooks/useAuth';

export const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions] = useState<Subscription[]>(() =>
    getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, [])
  );
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'Admin';

  const displaySubs = subscriptions.filter((s) => {
    const matchesRole = isAdmin || s.customerEmail.toLowerCase() === user?.email.toLowerCase();
    const matchesSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.planName.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            {isAdmin ? 'All Active Subscriptions' : 'My Subscription'}
          </h1>
          <p className="text-xs text-secondaryText mt-1">
            Track active customer plans, renewal timelines, and recurring billing frequencies.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-mutedText" />
          <input
            type="text"
            placeholder="Search subscriptions by customer or plan name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary font-medium"
          />
        </div>
      </Card>

      <Card space-y-4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Subscriber</th>
                <th className="p-3 font-semibold">Plan Name</th>
                <th className="p-3 font-semibold">Billing Frequency</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Next Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displaySubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-tableHover transition-colors">
                  <td className="p-3 font-bold text-heading">
                    {sub.customerName}
                    <div className="text-[10px] text-mutedText font-normal">{sub.customerEmail}</div>
                  </td>
                  <td className="p-3 font-semibold text-primaryText">{sub.planName}</td>
                  <td className="p-3 text-secondaryText font-medium">{sub.billingCycle}</td>
                  <td className="p-3 font-bold text-heading">{formatCurrency(sub.amount)}</td>
                  <td className="p-3">
                    <Badge variant={sub.status === 'Active' ? 'success' : 'warning'}>{sub.status}</Badge>
                  </td>
                  <td className="p-3 text-right text-mutedText font-medium">{formatDate(sub.nextBillingDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
