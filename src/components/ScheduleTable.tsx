
import React from 'react';
import { DriverInfo, ScheduleTable as ScheduleTableType, ShiftType } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations';
import { SunIcon, MoonIcon, LockIcon, UsersIcon, UserCheckIcon } from 'lucide-react';
import { formatDate, isDateInPast } from '../utils.ts';

const DAY_NAME_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAME_MAP_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

interface ScheduleTableProps {
  activeTable: ScheduleTableType;
  dates: Date[];
  language: 'ar' | 'nl';
  isAdmin: boolean;
  openSelectionModal: (date: Date, shift: ShiftType) => void;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  activeTable,
  dates,
  language,
  isAdmin,
  openSelectionModal,
}) => {
  const t = useTranslations(language);

  const getDayKey = (date: Date) => date.toISOString().split('T')[0];

  const renderDriverNames = (drivers: DriverInfo[] | undefined) => {
    if (!drivers || drivers.length === 0) return null;
    return (
      <div className="flex flex-col items-center gap-1">
        {drivers.length > 1 ? <UsersIcon className="w-4 h-4" /> : <UserCheckIcon className="w-4 h-4" />}
        {drivers.map(driver => (
          <span key={driver.id} className="font-bold text-sm text-center line-clamp-1">{driver.name}</span>
        ))}
      </div>
    );
  };

  const renderScheduleCell = (date: Date) => {
    const dayKey = getDayKey(date);
    const isPast = isDateInPast(date);
    const dayName = (language === 'ar' ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL)[date.getDay()];
    const morningDrivers = activeTable.schedule[dayKey]?.morning?.drivers;
    const eveningDrivers = activeTable.schedule[dayKey]?.evening?.drivers;
    const canEdit = isAdmin && !isPast;

    return (
      <tr key={dayKey} className={`transition-colors ${isPast ? 'bg-slate-100/50' : 'hover:bg-indigo-50/30'}`}>
        <td className="py-6 px-4 bg-slate-50/80 border-l border-slate-100 min-w-[120px] relative">
          <div className="flex items-center gap-1">
            <p className={`font-bold ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>{dayName}</p>
            {isPast && <LockIcon className="w-3 h-3 text-slate-300" />}
          </div>
          <p className={`text-[11px] font-bold mt-1 px-1 py-0.5 rounded inline-block ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
            {formatDate(date)}
          </p>
        </td>
        <td className="p-2 border-l border-slate-100">
          <button 
            disabled={!canEdit} 
            onClick={() => openSelectionModal(date, 'morning')} 
            className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
              !canEdit ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              canEdit && morningDrivers?.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : canEdit ? 'border-slate-200 text-slate-300 hover:border-indigo-300' : ''
            } ${
              isPast && morningDrivers?.length ? 'bg-slate-200 border-slate-300 text-slate-500' : ''
            }`}>
            {morningDrivers?.length ? renderDriverNames(morningDrivers) : <span className="text-xs">{t.scheduleApp.assign}</span>}
          </button>
        </td>
        <td className="p-2">
          <button 
            disabled={!canEdit} 
            onClick={() => openSelectionModal(date, 'evening')} 
            className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
              !canEdit ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              canEdit && eveningDrivers?.length ? 'bg-slate-800 border-slate-700 text-slate-100' : canEdit ? 'border-slate-200 text-slate-300 hover:border-slate-400' : ''
            } ${
              isPast && eveningDrivers?.length ? 'bg-slate-700 border-slate-600 text-slate-400' : ''
            }`}>
            {eveningDrivers?.length ? renderDriverNames(eveningDrivers) : <span className="text-xs">{t.scheduleApp.assign}</span>}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="py-4 px-4 font-bold border-l w-24">{t.scheduleApp.day}</th>
            <th className="py-4 px-4 font-bold border-l">
              <div className="flex items-center justify-center gap-2"><SunIcon className="w-4 h-4" /><span>{t.scheduleApp.morning}</span></div>
            </th>
            <th className="py-4 px-4 font-bold">
              <div className="flex items-center justify-center gap-2"><MoonIcon className="w-4 h-4" /><span>{t.scheduleApp.evening}</span></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {dates.map(date => renderScheduleCell(date))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
