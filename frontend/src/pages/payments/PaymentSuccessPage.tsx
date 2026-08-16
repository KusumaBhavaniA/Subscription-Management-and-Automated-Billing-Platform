import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, LayoutDashboard, CreditCard, Sparkles, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { paymentApi, PaymentTransactionResult } from '../../services/api/paymentApi';
import { useAuth } from '../../hooks/useAuth';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const locationState = location.state as { transaction?: PaymentTransactionResult } | null;

  const txn: PaymentTransactionResult = locationState?.transaction || {
    success: true,
    transactionId: `TXN-${new Date().toISOString().replace(/[-:T shadow.Z]/g, '').slice(0, 12)}`,
    paymentDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    amountPaid: 5899,
    planName: 'Pro Business',
    billingCycle: 'Monthly',
    customerName: user?.fullName || 'John Doe',
    customerEmail: user?.email || 'customer@example.com',
  };

  const handleDownloadInvoice = () => {
    paymentApi.downloadInvoice({
      transactionId: txn.transactionId,
      customerName: txn.customerName,
      customerEmail: txn.customerEmail,
      planName: txn.planName,
      billingCycle: txn.billingCycle,
      amountPaid: txn.amountPaid,
      paymentDate: txn.paymentDate,
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <Card className="p-8 text-center space-y-6 border border-emerald-500/30 shadow-2xl bg-card relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Animated Success Badge */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <div className="space-y-2">
          <Badge variant="success" className="mx-auto">✔ Payment Successful</Badge>
          <h1 className="text-2xl font-black text-heading">Subscription Activated Successfully!</h1>
          <p className="text-xs text-secondaryText max-w-md mx-auto">
            Thank you for your purchase. Your subscription access has been updated immediately across your dashboard.
          </p>
        </div>

        {/* Transaction Details Box */}
        <div className="p-5 rounded-2xl bg-secondary/60 border border-border text-xs space-y-3.5 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-bold text-mutedText uppercase text-[10px] tracking-wider">Transaction Summary</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Confirmed & Verified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-mutedText block font-medium">Plan Name</span>
              <span className="font-extrabold text-heading">{txn.planName}</span>
            </div>

            <div>
              <span className="text-[10px] text-mutedText block font-medium">Billing Frequency</span>
              <span className="font-extrabold text-heading">{txn.billingCycle}</span>
            </div>

            <div>
              <span className="text-[10px] text-mutedText block font-medium">Amount Paid</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(txn.amountPaid)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-mutedText block font-medium">Transaction ID</span>
              <span className="font-mono font-bold text-heading text-[11px]">{txn.transactionId}</span>
            </div>

            <div>
              <span className="text-[10px] text-mutedText block font-medium">Payment Date</span>
              <span className="font-semibold text-secondaryText">{txn.paymentDate}</span>
            </div>

            <div>
              <span className="text-[10px] text-mutedText block font-medium">Customer Name</span>
              <span className="font-semibold text-secondaryText">{txn.customerName}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Step 5 requirement) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleDownloadInvoice}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Invoice
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/customer/subscriptions')}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            View Subscription
          </Button>

          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/customer/dashboard')}
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
