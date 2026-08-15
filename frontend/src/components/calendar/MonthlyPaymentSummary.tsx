import React from 'react';
import { DollarSign, CheckCircle2, XCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { Card } from '../common/Card';
import { PaymentTransaction } from '../../types/payment';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyPaymentSummaryProps {
  payments: PaymentTransaction[];
  year: number;
  month: number; // 0-indexed
}

export const MonthlyPaymentSummary: React.FC<MonthlyPaymentSummaryProps> = ({
  payments,
  year,
  month,
}) => {
  // Filter payments for selected year and month
  const monthlyPayments = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalPayments = monthlyPayments.length;
  const successfulCount = monthlyPayments.filter((p) => p.status === 'SUCCESS').length;
  const failedCount = monthlyPayments.filter((p) => p.status === 'FAILED').length;
  const cancelledCount = monthlyPayments.filter((p) => p.status === 'CANCELLED').length;
  const pendingCount = monthlyPayments.filter((p) => p.status === 'PENDING').length;
  const totalRevenue = monthlyPayments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    {
      label: 'Total Payments',
      value: totalPayments.toString(),
      icon: CreditCard,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Successful',
      value: successfulCount.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Failed',
      value: failedCount.toString(),
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      label: 'Cancelled',
      value: cancelledCount.toString(),
      icon: AlertTriangle,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
    },
    {
      label: 'Pending',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-3.5">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${s.bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <span className="text-[11px] font-semibold text-secondaryText truncate">{s.label}</span>
            </div>
            <p className="text-lg font-extrabold text-heading mt-2">{s.value}</p>
          </Card>
        );
      })}
    </div>
  );
};
