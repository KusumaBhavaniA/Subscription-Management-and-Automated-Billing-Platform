import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, ArrowUpRight, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { paymentApi } from '../../services/api/paymentApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuspended = user?.role === 'Customer' && (user?.accountStatus === 'SUSPENDED' || user?.status === 'Suspended');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
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

  const filteredTxns = transactions.filter((t) => {
    const ref = (t.reference || t.id || '').toLowerCase();
    const cust = (t.customerName || t.customer || '').toLowerCase();
    const method = (t.method || t.paymentMethod || '').toLowerCase();
    const q = search.toLowerCase();
    return ref.includes(q) || cust.includes(q) || method.includes(q);
  });

  const totalTxnCount = transactions.length;
  const successfulCount = transactions.filter((t) => t.status === 'Success' || t.status === 'Paid').length;
  const pendingCount = transactions.filter((t) => t.status === 'Pending').length;
  const failedCount = transactions.filter((t) => t.status === 'Failed' || t.status === 'Refunded').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Payment Transactions"
        subtitle="Detailed payment processor logs, gateway transactions, and receipts."
        icon={DollarSign}
      />

      {/* SUSPENSION WARNING BANNER */}
      {isSuspended && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold">
              Your account is currently suspended. Subscription purchases and payments are disabled. Please contact Support to request restoration.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/customer/support')}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0 cursor-pointer"
          >
            Contact Support
          </Button>
        </div>
      )}

      {/* Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Total Transactions</span>
          <p className="text-xl sm:text-2xl font-black text-heading mt-1">{totalTxnCount}</p>
          <span className="text-[10px] text-secondaryText font-medium">All gateway logs</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Successful</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{successfulCount}</p>
          <span className="text-[10px] text-mutedText font-medium">Settled transactions</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-mutedText font-medium">In processing</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Failed / Refunded</span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{failedCount}</p>
          <span className="text-[10px] text-mutedText font-medium">Unsettled attempts</span>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md w-full">
          <SearchInput
            placeholder="Search transaction reference, customer, or gateway..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div className="text-xs text-secondaryText font-medium">
          Showing <span className="text-heading font-extrabold">{filteredTxns.length}</span> transaction logs
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-0 overflow-hidden border border-border">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-mutedText text-[11px] uppercase tracking-wider bg-tableHeader">
                  <th className="py-3 px-4 font-bold">Transaction Reference</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Payment Gateway</th>
                  <th className="py-3 px-4 font-bold text-right">Amount</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={DollarSign}
                        title="No Payment Transactions"
                        description="Payment activity will appear here after the first successful or attempted transaction."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((t) => {
                    const custName = (t.customerName && !t.customerName.includes('@'))
                      ? t.customerName
                      : (t.customer && !t.customer.includes('@'))
                      ? t.customer
                      : (user?.fullName || 'Customer');

                    return (
                      <tr key={t.id || t.reference} className="hover:bg-tableHover transition-colors group">
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {t.reference || t.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={custName} size="sm" />
                            <span className="font-bold text-heading">{custName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-secondary text-primary font-semibold text-[11px]">
                            {t.method || t.paymentMethod || 'Stripe'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              t.status === 'Success' || t.status === 'Paid'
                                ? 'PAID'
                                : t.status === 'Refunded'
                                ? 'neutral'
                                : 'PENDING'
                            }
                            dot
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-secondaryText font-medium">
                          {formatDate(t.date || t.paymentDate)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedTxn(t)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* TRANSACTION DETAIL MODAL */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Transaction: ${selectedTxn.reference || selectedTxn.id}`}
        >
          <div className="space-y-4 text-xs p-1">
            <div className="p-3 bg-secondary/60 rounded-xl border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Settlement Amount</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedTxn.amount)}
                </span>
              </div>
              <Badge
                variant={
                  selectedTxn.status === 'Success' || selectedTxn.status === 'Paid'
                    ? 'PAID'
                    : selectedTxn.status === 'Refunded'
                    ? 'neutral'
                    : 'PENDING'
                }
                dot
              >
                {selectedTxn.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Transaction Ref</span>
                <span className="font-mono font-bold text-heading">{selectedTxn.reference || selectedTxn.id}</span>
              </div>
              <div className="p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Payment Gateway</span>
                <span className="font-bold text-primary">{selectedTxn.method || selectedTxn.paymentMethod || 'Stripe'}</span>
              </div>
              <div className="p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Timestamp</span>
                <span className="font-medium text-heading">{formatDate(selectedTxn.date || selectedTxn.paymentDate)}</span>
              </div>
              <div className="p-3 rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">Processor Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Captured & Verified</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="primary" size="sm" onClick={() => setSelectedTxn(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


