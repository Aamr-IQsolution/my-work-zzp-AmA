
import React from 'react';
import { Driver } from '../types.ts';
import { useTranslations } from '../hooks/useTranslations.ts';
import { PlusIcon, TrashIcon, Edit2Icon, CheckIcon, XIcon } from 'lucide-react';

interface DriverListProps {
  drivers: Driver[];
  isAdmin: boolean;
  language: 'ar' | 'nl';
  inputName: string;
  setInputName: (name: string) => void;
  handleAddDriver: (e: React.FormEvent) => void;
  editingDriverId: number | null;
  editingDriverName: string;
  setEditingDriverName: (name: string) => void;
  handleStartEdit: (driver: Driver) => void;
  handleSaveDriverName: (driverId: number) => void;
  handleCancelEdit: () => void;
  handleDeleteDriver: (driverId: number) => void;
}

const DriverList: React.FC<DriverListProps> = ({
  drivers,
  isAdmin,
  language,
  inputName,
  setInputName,
  handleAddDriver,
  editingDriverId,
  editingDriverName,
  setEditingDriverName,
  handleStartEdit,
  handleSaveDriverName,
  handleCancelEdit,
  handleDeleteDriver,
}) => {
  const t = useTranslations(language);

  return (
    <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
      {isAdmin && (
        <section className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            {t.scheduleApp.addDriver}
          </h3>
          <form onSubmit={handleAddDriver} className="space-y-3 mt-4">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder={t.scheduleApp.driverNamePlaceholder}
              className="w-full px-4 py-3 rounded-xl border-slate-200"
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl">
              {t.general.save}
            </button>
          </form>
        </section>
      )}
      <section className="bg-white rounded-2xl shadow-sm border">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{t.scheduleApp.drivers}</h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            {drivers.length}
          </span>
        </div>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {drivers.map(driver => (
            <div key={driver.id} className="p-4 flex items-center justify-between group">
              {isAdmin && editingDriverId === driver.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingDriverName}
                    onChange={(e) => setEditingDriverName(e.target.value)}
                    className="w-full px-2 py-1 rounded border"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDriverName(driver.id)}
                  />
                  <button onClick={() => handleSaveDriverName(driver.id)} className="p-1.5 text-green-500">
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button onClick={handleCancelEdit} className="p-1.5 text-slate-400">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                      {driver.name.charAt(0)}
                    </div>
                    <span className="font-medium">{driver.name}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100">
                      <button onClick={() => handleStartEdit(driver)} className="p-1.5">
                        <Edit2Icon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {drivers.length === 0 && <div className="p-10 text-center text-sm">{t.scheduleApp.noDrivers}</div>}
        </div>
      </section>
    </div>
  );
};

export default DriverList;
