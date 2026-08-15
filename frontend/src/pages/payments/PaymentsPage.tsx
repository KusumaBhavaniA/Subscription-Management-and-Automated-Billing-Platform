import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { paymentApi } from '../../services/api/paymentApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        if (user?.email) {
          const list = await paymentApi.getPaymentTransactions(user.email, user.role);
          setTransactions(list);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error('Failed to load payment transactions:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

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
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-secondaryText mt-3 font-semibold">Loading payment transactions...</p>
          </div>
        ) : (
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-secondaryText font-medium">
                      <AlertCircle className="w-8 h-8 text-mutedText mx-auto mb-2" />
                      No payment transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id || t.reference} className="hover:bg-tableHover transition-colors">
                      <td className="p-3 font-bold text-heading">{t.reference || t.id}</td>
                      <td className="p-3 text-secondaryText font-semibold">{t.customer || t.customerName || user?.fullName}</td>
                      <td className="p-3 text-mutedText">{t.method || t.paymentMethod || 'Stripe'}</td>
                      <td className="p-3 font-bold text-heading">{formatCurrency(t.amount)}</td>
                      <td className="p-3">
                        <Badge variant={t.status === 'Success' || t.status === 'Paid' ? 'success' : 'warning'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-mutedText">{formatDate(t.date || t.paymentDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
