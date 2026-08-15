import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../common/Button';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  const monthYearString = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-heading tracking-tight">{monthYearString}</h2>
          <p className="text-xs text-secondaryText">Monthly Payment Activity Overview</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="font-bold text-xs"
        >
          Today
        </Button>
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg hover:bg-card hover:shadow-xs text-secondaryText hover:text-heading transition-all cursor-pointer"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-2 text-heading hidden md:inline">
            {monthYearString}
          </span>
          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg hover:bg-card hover:shadow-xs text-secondaryText hover:text-heading transition-all cursor-pointer"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
