import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { CalendarHeader } from './CalendarHeader';
import { MonthlyPaymentSummary } from './MonthlyPaymentSummary';
import { CalendarGrid } from './CalendarGrid';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { DayPaymentsModal } from './DayPaymentsModal';
import { PaymentTransaction } from '../../types/payment';
import { paymentApi } from '../../services/api/paymentApi';

export const PaymentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

  // State for Day Payments modal (+X more)
  const [dayModalState, setDayModalState] = useState<{
    isOpen: boolean;
    dateStr: string | null;
    payments: PaymentTransaction[];
  }>({
    isOpen: false,
    dateStr: null,
    payments: [],
  });

  // Load payment transactions on mount
  useEffect(() => {
    paymentApi.getPaymentTransactions('', 'Admin').then((list) => {
      setPayments(list || []);
    });
  }, []);


  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 15)); // Set to today (August 15, 2026)
  };

  const handleShowMore = (dateStr: string, dayPayments: PaymentTransaction[]) => {
    setDayModalState({
      isOpen: true,
      dateStr,
      payments: dayPayments,
    });
  };

  return (
    <Card className="p-5 space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-lg font-extrabold text-heading">Payment Calendar</h2>
        <p className="text-xs text-secondaryText mt-0.5">
          View customer payment activity and transaction status by date.
        </p>
      </div>

      {/* Monthly Summary Cards */}
      <MonthlyPaymentSummary
        payments={payments}
        year={currentDate.getFullYear()}
        month={currentDate.getMonth()}
      />

      {/* Calendar Navigation Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Main Calendar Month Grid */}
      <CalendarGrid
        currentDate={currentDate}
        payments={payments}
        onSelectPayment={(p) => setSelectedPayment(p)}
        onShowMore={handleShowMore}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={Boolean(selectedPayment)}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />

      {/* Day Payments List Modal (+X More) */}
      <DayPaymentsModal
        isOpen={dayModalState.isOpen}
        dateStr={dayModalState.dateStr}
        payments={dayModalState.payments}
        onClose={() => setDayModalState((prev) => ({ ...prev, isOpen: false }))}
        onSelectPayment={(p) => setSelectedPayment(p)}
      />
    </Card>
  );
};

export default PaymentCalendar;

