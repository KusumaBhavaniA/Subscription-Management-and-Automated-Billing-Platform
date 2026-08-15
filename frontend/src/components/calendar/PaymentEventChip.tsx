import React from 'react';
import { PaymentTransaction } from '../../types/payment';
import { formatCurrency } from '../../utils/formatters';

interface PaymentEventChipProps {
  payment: PaymentTransaction;
  onClick: (payment: PaymentTransaction) => void;
}

export const PaymentEventChip: React.FC<PaymentEventChipProps> = ({ payment, onClick }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'FAILED':
        return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'CANCELLED':
        return 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30';
      case 'PENDING':
        return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-secondary hover:bg-secondary/80 text-secondaryText border-border';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500 text-white';
      case 'FAILED':
        return 'bg-rose-500 text-white';
      case 'CANCELLED':
        return 'bg-slate-400 text-white';
      case 'PENDING':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-secondaryText text-white';
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(payment);
      }}
      className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${getStatusStyles(
        payment.status
      )}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold truncate max-w-[85px] leading-tight">
          {payment.customerName}
        </span>
        <span
          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${getStatusBadgeStyle(
            payment.status
          )}`}
        >
          {payment.status}
        </span>
      </div>
      <div className="text-[10px] font-extrabold mt-0.5 opacity-90">
        {formatCurrency(payment.amount)}
      </div>
    </button>
  );
};
