
import React from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from 'lucide-react';
import { useTranslations } from '../hooks/useTranslations';
import { getMonthNameAR, getMonthNameNL } from '../utils.ts';

interface ScheduleHeaderProps {
  viewMode: 'weekly' | 'monthly';
  currentWeek: number;
  currentMonth: number;
  currentYear: number;
  language: 'ar' | 'nl';
  changeDate: (offset: number) => void;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  viewMode,
  currentWeek,
  currentMonth,
  currentYear,
  language,
  changeDate
}) => {
  const t = useTranslations(language);
  const monthName = language === 'ar' ? getMonthNameAR(currentMonth) : getMonthNameNL(currentMonth);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 flex justify-between items-center" dir="ltr">
      <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <div className="text-center">
        {viewMode === 'weekly' ? (
          <h2 className="text-xl font-bold text-slate-800">{t.scheduleApp.week} {currentWeek}</h2>
        ) : (
          <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
        )}
        <p className="text-sm font-medium text-slate-500">{currentYear}</p>
      </div>
      <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ScheduleHeader;
