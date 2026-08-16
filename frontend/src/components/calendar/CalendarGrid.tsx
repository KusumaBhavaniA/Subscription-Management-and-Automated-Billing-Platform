import React from 'react';
import { CalendarDay } from './CalendarDay';
import { PaymentTransaction } from '../../types/payment';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  payments: PaymentTransaction[];
  onSelectPayment: (payment: PaymentTransaction) => void;
  onShowMore: (dateStr: string, payments: PaymentTransaction[]) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  payments,
  onSelectPayment,
  onShowMore,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Weekday Headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid dates
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Check if current month has any payment activity
  const monthlyPaymentsCount = payments.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const gridCells: {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // 1. Previous Month Leading Days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(prevDay).padStart(2, '0');

    gridCells.push({
      dayNumber: prevDay,
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // 2. Current Month Days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const isTodayCell = year === todayYear && month === todayMonth && d === todayDay;

    gridCells.push({
      dayNumber: d,
      dateStr: `${year}-${mStr}-${dStr}`,
      isCurrentMonth: true,
      isToday: isTodayCell,
    });
  }

  // 3. Next Month Trailing Days (fill to multiple of 7, up to 35 or 42)
  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');

    gridCells.push({
      dayNumber: i,
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Map payments to dateStr
  const paymentsByDate: Record<string, PaymentTransaction[]> = {};
  payments.forEach((p) => {
    if (!paymentsByDate[p.date]) {
      paymentsByDate[p.date] = [];
    }
    paymentsByDate[p.date].push(p);
  });

  return (
    <div className="space-y-4">
      {/* Empty Month Banner if 0 payments */}
      {monthlyPaymentsCount === 0 && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center text-xs text-mutedText flex items-center justify-center gap-2">
          <CalendarIcon className="w-4 h-4 text-mutedText" />
          <span className="font-semibold">No payment activity for this month.</span>
        </div>
      )}

      {/* Grid Container */}
      <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 bg-tableHeader border-b border-border text-center">
          {weekDays.map((w, idx) => (
            <div
              key={w}
              className={`py-2 text-[11px] font-black uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-primary' : 'text-secondaryText'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells Grid */}
        <div className="grid grid-cols-7">
          {gridCells.map((cell) => {
            const cellPayments = paymentsByDate[cell.dateStr] || [];
            return (
              <CalendarDay
                key={cell.dateStr}
                dayNumber={cell.dayNumber}
                dateStr={cell.dateStr}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={cell.isToday}
                payments={cellPayments}
                onSelectPayment={onSelectPayment}
                onShowMore={onShowMore}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
