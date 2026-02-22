
import React from 'react';
import { Driver, ShiftType } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations';
import { formatDate } from '../utils.ts';
import { CheckIcon, UserCheckIcon } from 'lucide-react';

const DAY_NAME_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAME_MAP_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

interface DriverSelectionModalProps {
  isOpen: boolean;
  drivers: Driver[];
  selectionModal: { date: Date; shift: ShiftType };
  selectedDrivers: number[];
  language: 'ar' | 'nl';
  toggleDriverSelection: (driverId: number) => void;
  handleAssignDrivers: () => void;
  setSelectedDrivers: (drivers: number[]) => void;
}

const DriverSelectionModal: React.FC<DriverSelectionModalProps> = ({
  isOpen,
  drivers,
  selectionModal,
  selectedDrivers,
  language,
  toggleDriverSelection,
  handleAssignDrivers,
  setSelectedDrivers,
}) => {
  const t = useTranslations(language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl">
        <div className="bg-indigo-700 p-6 text-white">
          <h3 className="text-xl font-bold">{t.scheduleApp.selectDrivers}</h3>
          <p className="text-xs mt-1">
            {(language === 'ar' ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL)[selectionModal.date.getDay()]} {formatDate(selectionModal.date)} - {selectionModal.shift === 'morning' ? t.scheduleApp.morning : t.scheduleApp.evening}
          </p>
        </div>
        <div className="p-2 bg-slate-50 max-h-[50vh] overflow-y-auto">
          <div className="p-2 space-y-2">
            {drivers.map(driver => {
              const isSelected = selectedDrivers.includes(driver.id);
              return (
                <button key={driver.id} onClick={() => toggleDriverSelection(driver.id)} className={`w-full p-4 rounded-xl border-2 flex items-center justify-between ${isSelected ? 'bg-white border-indigo-500' : 'border-transparent bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                      {driver.name.charAt(0)}
                    </div>
                    <span className={`font-bold ${isSelected ? 'text-indigo-700' : ''}`}>{driver.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200'}`}>
                    {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
            {drivers.length === 0 && (
              <div className="p-8 text-center">
                <p>{t.scheduleApp.addDriverFirst}</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 bg-white border-t flex flex-col gap-2">
          <button onClick={handleAssignDrivers} className="w-full bg-indigo-600 text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2">
            <UserCheckIcon className="w-5 h-5" />
            {t.general.save} ({selectedDrivers.length})
          </button>
          <button onClick={() => setSelectedDrivers([])} className="w-full bg-slate-100 text-slate-600 font-bold py-2 px-5 rounded-xl">
            {t.general.clear}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverSelectionModal;
