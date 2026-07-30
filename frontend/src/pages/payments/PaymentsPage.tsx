import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentsPage: React.FC = () => {
  const transactions = [
    { id: 'txn-1', reference: 'TXN-99201', customer: 'Priya Sundaram', method: 'Stripe (Visa)', amount: 14999, status: 'Success', date: '2026-07-01' },
    { id: 'txn-2', reference: 'TXN-99202', customer: 'Rohan Sharma', method: 'Razorpay (UPI)', amount: 4999, status: 'Success', date: '2026-07-05' },
    { id: 'txn-3', reference: 'TXN-99203', customer: 'Aarav Mehta', method: 'Stripe (Mastercard)', amount: 1999, status: 'Success', date: '2026-06-10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-heading flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Payment Transactions
        </h1>
        <p className="text-xs text-secondaryText mt-1">
          Detailed payment processor logs, gateway transactions, and receipts.
        </p>
      </div>

      <Card space-y-4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-mutedText uppercase tracking-wider bg-tableHeader">
                <th className="p-3 font-semibold">Transaction Reference</th>
                <th className="p-3 font-semibold">Customer</th>
                <th className="p-3 font-semibold">Payment Gateway</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-tableHover transition-colors">
                  <td className="p-3 font-bold text-heading">{t.reference}</td>
                  <td className="p-3 text-secondaryText font-semibold">{t.customer}</td>
                  <td className="p-3 text-mutedText">{t.method}</td>
                  <td className="p-3 font-bold text-heading">{formatCurrency(t.amount)}</td>
                  <td className="p-3">
                    <Badge variant="success">{t.status}</Badge>
                  </td>
                  <td className="p-3 text-right text-mutedText">{formatDate(t.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
