import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  User,
  Mail,
  Phone,
  FileText,
  Calendar as CalendarIcon,
  Globe,
  Tag,
  Hash,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { PaymentTransaction } from '../../types/payment';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface PaymentDetailsModalProps {
  payment: PaymentTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  if (!payment) return null;

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return {
          text: 'Payment completed successfully.',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
          iconColor: 'text-emerald-500',
        };
      case 'FAILED':
        return {
          text: 'Payment failed. No successful transaction was recorded.',
          icon: XCircle,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300',
          iconColor: 'text-rose-500',
        };
      case 'CANCELLED':
        return {
          text: 'Payment was cancelled.',
          icon: AlertTriangle,
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-800 dark:text-slate-300',
          iconColor: 'text-slate-400',
        };
      case 'PENDING':
        return {
          text: 'Payment is currently pending.',
          icon: Clock,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300',
          iconColor: 'text-amber-500',
        };
      default:
        return {
          text: 'Transaction status logged.',
          icon: CheckCircle2,
          bg: 'bg-secondary border-border text-secondaryText',
          iconColor: 'text-primary',
        };
    }
  };

  const statusInfo = getStatusMessage(payment.status);
  const StatusIcon = statusInfo.icon;

  const detailsList = [
    { label: 'Transaction ID', value: payment.id, icon: Hash },
    { label: 'Customer ID', value: payment.customerId, icon: Tag },
    { label: 'Customer Name', value: payment.customerName, icon: User },
    { label: 'Customer Email', value: payment.customerEmail, icon: Mail },
    { label: 'Customer Mobile', value: payment.customerMobile || '+91 98765 43210', icon: Phone },
    { label: 'Payment Amount', value: formatCurrency(payment.amount), icon: CreditCard, highlight: true },
    { label: 'Payment Gateway', value: payment.gateway, icon: Globe },
    { label: 'Payment Method', value: payment.method, icon: CreditCard },
    { label: 'Payment Date', value: formatDate(payment.date), icon: CalendarIcon },
    { label: 'Payment Time', value: payment.time, icon: Clock },
    { label: 'Subscription / Plan', value: payment.plan, icon: Tag },
    { label: 'Invoice ID', value: payment.invoiceId, icon: FileText },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Details"
      description={`Transaction Audit Record for ${payment.id}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Status Message Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${statusInfo.bg}`}>
          <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusInfo.iconColor}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-sm">{statusInfo.text}</span>
              <Badge
                variant={
                  payment.status === 'SUCCESS'
                    ? 'success'
                    : payment.status === 'FAILED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {payment.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {detailsList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-secondaryText" />
                  <span className="text-[11px] font-bold text-secondaryText uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    item.highlight ? 'font-black text-primary text-base' : 'font-bold text-heading'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Close Action */}
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover transition-all cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
};
