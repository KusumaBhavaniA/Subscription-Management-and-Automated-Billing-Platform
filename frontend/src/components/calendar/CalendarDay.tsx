import React from 'react';
import { PaymentTransaction } from '../../types/payment';
import { PaymentEventChip } from './PaymentEventChip';

interface CalendarDayProps {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  payments: PaymentTransaction[];
  onSelectPayment: (payment: PaymentTransaction) => void;
  onShowMore: (dateStr: string, payments: PaymentTransaction[]) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  dayNumber,
  dateStr,
  isCurrentMonth,
  isToday,
  payments,
  onSelectPayment,
  onShowMore,
}) => {
  const maxDisplay = 2;
  const visiblePayments = payments.slice(0, maxDisplay);
  const overflowCount = payments.length - maxDisplay;

  return (
    <div
      className={`min-h-[105px] p-1.5 border-b border-r border-border flex flex-col justify-between transition-colors ${
        !isCurrentMonth ? 'bg-secondary/20 text-mutedText/60' : 'bg-card text-heading hover:bg-secondary/30'
      }`}
    >
      {/* Top Bar: Day Number & Today Highlight */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
            isToday
              ? 'bg-primary text-white shadow-xs font-extrabold ring-2 ring-primary/30'
              : !isCurrentMonth
              ? 'text-mutedText/60 font-medium'
              : 'text-heading font-bold'
          }`}
        >
          {dayNumber}
        </span>
        {payments.length > 0 && isCurrentMonth && (
          <span className="text-[10px] font-extrabold text-secondaryText px-1 bg-secondary rounded-sm">
            {payments.length}
          </span>
        )}
      </div>

      {/* Payment Events */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {isCurrentMonth &&
          visiblePayments.map((p) => (
            <PaymentEventChip key={p.id} payment={p} onClick={onSelectPayment} />
          ))}
      </div>

      {/* Overflow Button */}
      {isCurrentMonth && overflowCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowMore(dateStr, payments);
          }}
          className="w-full text-center text-[10px] font-extrabold text-primary hover:text-primary-hover py-0.5 mt-1 rounded bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
        >
          +{overflowCount} more
        </button>
      )}
    </div>
  );
};
