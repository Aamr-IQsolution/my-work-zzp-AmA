
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusIcon, TrashIcon, MapPinIcon, UserCheckIcon, 
  XIcon, SunIcon, MoonIcon, Share2Icon, 
  DownloadIcon, FileJsonIcon, CopyIcon, CheckIcon, 
  LockIcon, ChevronRightIcon, ChevronLeftIcon, CalendarDaysIcon, UsersIcon,
  FileTextIcon, Edit2Icon, CalendarIcon, ViewIcon, EyeIcon, CalendarRangeIcon
} from 'lucide-react';
import { Driver, WeeklySchedule, ShiftType, DriverInfo, ScheduleTable } from './types';
import { 
  getISOWeek, getCurrentYear, getDatesForISOWeek, formatDate, isDateInPast,
  getDaysInMonth, getMonthNameAR, getMonthNameNL
} from './utils';

const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

const AlasaylLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`relative flex-shrink-0 rounded-full bg-white shadow-2xl overflow-hidden border border-slate-200 flex items-center justify-center ${className}`}>
    <img 
      src="https://files.oaiusercontent.com/file-K1kI29tVq44C1P16OqR35Y7P?se=2025-02-17T21%3A25%3A58Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D734444d3-057b-40b5-9b2b-093f41e97dfc.webp&sig=m2Xv7%2BzU9yNf1S%2BzXoH5L%2BhB3N6uE5x8Xm2t6L/vY7E%3D" 
      alt="Alasayl Transport Logo" 
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Alasayl&background=4338ca&color=fff";
      }}
    />
  </div>
);

// A mapping to get the day name in Arabic from a Date object (0=Sunday, 1=Monday...)
const DAY_NAME_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const App: React.FC = () => {
  // Core Data State
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scheduleTables, setScheduleTables] = useState<ScheduleTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  
  // View & Date State
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Derived date values
  const currentWeek = getISOWeek(currentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Dates to render based on view mode
  const weekDates = useMemo(() => getDatesForISOWeek(currentWeek, currentYear), [currentWeek, currentYear]);
  const monthDates = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear]);

  // Input & Modal State
  const [inputName, setInputName] = useState('');
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriverName, setEditingDriverName] = useState('');
  const [selectionModal, setSelectionModal] = useState<{ date: Date; shift: ShiftType } | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [timeSelectorOpen, setTimeSelectorOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const activeTable = useMemo(() => scheduleTables.find(t => t.id === activeTableId), [scheduleTables, activeTableId]);

  // --- DATA LOADING & SAVING ---

  const getDayKey = (date: Date) => date.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const loadDataForDate = useCallback((date: Date) => {
    const dataKey = `schedule_data_d_${getDayKey(date)}`;
    try {
      const savedData = localStorage.getItem(dataKey);
      if (savedData) return JSON.parse(savedData);
    } catch (e) { console.error("Error parsing data for", date, e); }
    return [];
  }, []);

  const saveDataForDate = useCallback((date: Date, data: ScheduleTable[]) => {
    const dataKey = `schedule_data_d_${getDayKey(date)}`;
    if (data.length > 0) {
        localStorage.setItem(dataKey, JSON.stringify(data));
    } else {
        localStorage.removeItem(dataKey);
    }
  }, []);

  useEffect(() => {
    try {
      const savedDrivers = localStorage.getItem('drivers_pool');
      if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
    } catch (error) { console.error("Failed to parse drivers pool:", error); localStorage.removeItem('drivers_pool'); }

    const data = loadDataForDate(currentDate);
    setScheduleTables(data);
    setActiveTableId(data.length > 0 ? data[0].id : null);
  }, [currentDate, loadDataForDate]);

  useEffect(() => {
    localStorage.setItem('drivers_pool', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    saveDataForDate(currentDate, scheduleTables);
  }, [scheduleTables, currentDate, saveDataForDate]);


  // --- CRUD for Schedule Tables ---
  const addScheduleTable = () => {
    const newTable: ScheduleTable = {
      id: crypto.randomUUID(),
      title: `جدول ${scheduleTables.length + 1}`,
      routeInfo: '',
      schedule: {}
    };
    setScheduleTables(prev => [...prev, newTable]);
    setActiveTableId(newTable.id);
  };

  const deleteScheduleTable = (idToDelete: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجدول؟')) return;
    setScheduleTables(prev => {
      const newTables = prev.filter(t => t.id !== idToDelete);
      if (activeTableId === idToDelete) {
        setActiveTableId(newTables.length > 0 ? newTables[0].id : null);
      }
      return newTables;
    });
  };

  const updateActiveTable = (updates: Partial<Omit<ScheduleTable, 'id' | 'schedule'>>) => {
    if (!activeTableId) return;
    setScheduleTables(prev => prev.map(t => t.id === activeTableId ? { ...t, ...updates } : t));
  };

  // --- DRIVER & SCHEDULE LOGIC ---
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setDrivers(prev => [{ id: crypto.randomUUID(), name: inputName.trim(), addedAt: new Date().toISOString() }, ...prev]);
    setInputName('');
  };

  const handleStartEdit = (driver: Driver) => { setEditingDriverId(driver.id); setEditingDriverName(driver.name); };
  const handleCancelEdit = () => { setEditingDriverId(null); setEditingDriverName(''); };

  const handleSaveDriverName = (driverId: string) => {
    const newName = editingDriverName.trim();
    if (!newName) return alert("اسم السائق لا يمكن أن يكون فارغاً.");

    setDrivers(prev => prev.map(d => (d.id === driverId ? { ...d, name: newName } : d)));

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('schedule_data_d_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key)!);
                if (Array.isArray(data)) {
                    const updatedData = data.map((table: ScheduleTable) => {
                        const newSchedule = { ...table.schedule };
                        Object.keys(newSchedule).forEach(dateKey => {
                            const daySchedule = newSchedule[dateKey];
                            const updateDriver = (d: DriverInfo) => d.id === driverId ? { ...d, name: newName } : d;
                            if (daySchedule.morning?.drivers) daySchedule.morning.drivers = daySchedule.morning.drivers.map(updateDriver);
                            if (daySchedule.evening?.drivers) daySchedule.evening.drivers = daySchedule.evening.drivers.map(updateDriver);
                        });
                        return { ...table, schedule: newSchedule };
                    });
                    localStorage.setItem(key, JSON.stringify(updatedData));
                }
            } catch (e) { console.error(`Failed to update driver name in ${key}:`, e); }
        }
    }

    setScheduleTables(prev => prev.map(table => {
        const newSchedule = { ...table.schedule };
        Object.keys(newSchedule).forEach(dateKey => {
            const daySchedule = newSchedule[dateKey];
            const updateDriver = (d: DriverInfo) => d.id === driverId ? { ...d, name: newName } : d;
            if (daySchedule.morning?.drivers) daySchedule.morning.drivers = daySchedule.morning.drivers.map(updateDriver);
            if (daySchedule.evening?.drivers) daySchedule.evening.drivers = daySchedule.evening.drivers.map(updateDriver);
        });
        return { ...table, schedule: newSchedule };
    }));

    handleCancelEdit();
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السائق؟ سيتم إزالته من جميع الجداول والمناوبات.')) {
        setDrivers(prev => prev.filter(d => d.id !== id));
         for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('schedule_data_d_')) {
                 try {
                    const data = JSON.parse(localStorage.getItem(key)!);
                     if (Array.isArray(data)) {
                        const updatedData = data.map((table: ScheduleTable) => {
                            const newSchedule = { ...table.schedule };
                            Object.keys(newSchedule).forEach(dateKey => {
                                const daySchedule = newSchedule[dateKey];
                                if (daySchedule.morning?.drivers) daySchedule.morning.drivers = daySchedule.morning.drivers.filter(d => d.id !== id);
                                if (daySchedule.evening?.drivers) daySchedule.evening.drivers = daySchedule.evening.drivers.filter(d => d.id !== id);
                            });
                            return { ...table, schedule: newSchedule };
                        });
                        localStorage.setItem(key, JSON.stringify(updatedData));
                    }
                } catch (e) { console.error(`Failed to delete driver from ${key}:`, e); }
            }
        }
        setScheduleTables(prev => prev.map(table => {
            const newSchedule = { ...table.schedule };
            Object.keys(newSchedule).forEach(dateKey => {
                const daySchedule = newSchedule[dateKey];
                if (daySchedule.morning?.drivers) daySchedule.morning.drivers = daySchedule.morning.drivers.filter(d => d.id !== id);
                if (daySchedule.evening?.drivers) daySchedule.evening.drivers = daySchedule.evening.drivers.filter(d => d.id !== id);
            });
            return { ...table, schedule: newSchedule };
        }));
    }
  };
  
  const openSelectionModal = (date: Date, shift: ShiftType) => {
    if (isDateInPast(date) || !activeTable) return;
    const dayKey = getDayKey(date);
    const currentDrivers = activeTable.schedule[dayKey]?.[shift]?.drivers.map(d => d.id) || [];
    setSelectedDrivers(currentDrivers);
    setSelectionModal({ date, shift });
  }

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDrivers(prev => prev.includes(driverId) ? prev.filter(id => id !== driverId) : [...prev, driverId]);
  }

  const handleAssignDrivers = () => {
    if (!selectionModal || !activeTableId) return;
    const { date, shift } = selectionModal;
    const dayKey = getDayKey(date);

    const newDriverInfos: DriverInfo[] = drivers
      .filter(d => selectedDrivers.includes(d.id))
      .map(d => ({ id: d.id, name: d.name }));

    setScheduleTables(prev => prev.map(table => {
      if (table.id !== activeTableId) return table;
      
      const newSchedule: WeeklySchedule = {
        ...table.schedule,
        [dayKey]: {
          ...table.schedule[dayKey],
          [shift]: newDriverInfos.length > 0 ? { drivers: newDriverInfos } : null
        }
      };
      return { ...table, schedule: newSchedule };
    }));

    setSelectionModal(null);
    setSelectedDrivers([]);
  };

  // --- NAVIGATION ---
  const changeWeek = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      setCurrentDate(newDate);
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset, 1); // Go to the 1st of the month to avoid day-of-month issues
      setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // --- RENDER --- 
  const renderDriverNames = (drivers: DriverInfo[] | undefined) => {
    if (!drivers || drivers.length === 0) return null;
    return (
      <div className="flex flex-col items-center gap-1">
        {drivers.length > 1 ? <UsersIcon className="w-4 h-4 text-inherit" /> : <UserCheckIcon className="w-4 h-4 text-inherit" />}
        {drivers.map(driver => (
          <span key={driver.id} className="font-bold text-sm text-center line-clamp-1">{driver.name}</span>
        ))}
      </div>
    );
  }

  const renderScheduleCell = (date: Date) => {
      const dayKey = getDayKey(date);
      const isPast = isDateInPast(date);
      const morningDrivers = activeTable?.schedule[dayKey]?.morning?.drivers;
      const eveningDrivers = activeTable?.schedule[dayKey]?.evening?.drivers;
      
      return (
        <tr className={`transition-colors ${isPast ? 'bg-slate-100/50' : 'hover:bg-indigo-50/30'}`}>
          <td className="py-6 px-4 bg-slate-50/80 border-l border-slate-100 min-w-[120px] relative">
            <div className="flex items-center gap-1"><p className={`font-bold ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>{DAY_NAME_MAP_AR[date.getDay()]}</p>{isPast && <LockIcon className="w-3 h-3 text-slate-300" />}</div>
            <p className={`text-[11px] font-bold mt-1 px-1 py-0.5 rounded inline-block ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>{formatDate(date)}</p>
          </td>
          <td className="p-2 border-l border-slate-100">
            <button disabled={isPast} onClick={() => openSelectionModal(date, 'morning')} className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${isPast ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''} ${!isPast && morningDrivers?.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : !isPast ? 'border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-400' : ''} ${isPast && morningDrivers?.length ? 'bg-slate-200 border-slate-300 text-slate-500 shadow-none' : ''}`}>
              {morningDrivers?.length ? renderDriverNames(morningDrivers) : <span className="text-xs">{isPast ? 'مغلق' : '+ تعيين'}</span>}
            </button>
          </td>
          <td className="p-2">
            <button disabled={isPast} onClick={() => openSelectionModal(date, 'evening')} className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${isPast ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''} ${!isPast && eveningDrivers?.length ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-lg' : !isPast ? 'border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500' : ''} ${isPast && eveningDrivers?.length ? 'bg-slate-700 border-slate-600 text-slate-400 shadow-none' : ''}`}>
              {eveningDrivers?.length ? renderDriverNames(eveningDrivers) : <span className="text-xs">{isPast ? 'مغلق' : '+ تعيين'}</span>}
            </button>
          </td>
        </tr>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AlasaylLogo className="w-16 h-16 border-2 border-indigo-500/50 shadow-2xl" />
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Alasayl-my-work</h1>
              <p className="text-indigo-100 text-[10px] md:text-xs opacity-80 font-medium">نظام جدولة السائقين المتكامل</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={goToToday}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl border border-indigo-400/30 transition-all shadow-sm active:scale-95"
            >
              <CalendarIcon className="w-5 h-5 text-indigo-100" />
              <span className="font-bold text-sm hidden sm:inline">اليوم</span>
            </button>

            <div className="bg-indigo-900/50 rounded-xl p-1 flex items-center gap-1 border border-indigo-400/20">
                <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}><CalendarDaysIcon className="w-4 h-4" /> أسبوعي</button>
                <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}><CalendarRangeIcon className="w-4 h-4" /> شهري</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          {/* DRIVER MANAGEMENT */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><PlusIcon className="w-4 h-4 text-indigo-600" />إضافة سائق جديد</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleAddDriver} className="space-y-3">
                <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="اسم السائق..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-95">حفظ السائق</button>
              </form>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">قائمة السائقين</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{drivers.length}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {drivers.map(driver => (
                  <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    {editingDriverId === driver.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input type="text" value={editingDriverName} onChange={(e) => setEditingDriverName(e.target.value)} className="w-full px-2 py-1 rounded border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveDriverName(driver.id)} />
                        <button onClick={() => handleSaveDriverName(driver.id)} className="p-1.5 text-green-500 hover:bg-green-100 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                        <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XIcon className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{driver.name.charAt(0)}</div>
                          <span className="font-medium text-slate-700">{driver.name}</span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEdit(driver)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2Icon className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
              ))}
              {drivers.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">لا يوجد سائقين مضافين</div>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
            {/* --- VIEW HEADER --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex justify-between items-center">
                <button onClick={() => viewMode === 'weekly' ? changeWeek(-1) : changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRightIcon className="w-6 h-6 text-slate-500" /></button>
                <div className="text-center">
                    {viewMode === 'weekly' ? (
                        <h2 className="text-xl font-bold text-slate-800">أسبوع {currentWeek}</h2>
                    ) : (
                        <h2 className="text-xl font-bold text-slate-800">{getMonthNameAR(currentMonth)}</h2>
                    )}
                    <p className="text-sm text-slate-500 font-medium">{currentYear}</p>
                </div>
                <button onClick={() => viewMode === 'weekly' ? changeWeek(1) : changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeftIcon className="w-6 h-6 text-slate-500" /></button>
            </div>

          {/* SCHEDULE TABS */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {scheduleTables.map(table => (
              <div key={table.id} className="relative group">
                <button onClick={() => setActiveTableId(table.id)} className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 rounded-t-lg transition-all font-bold text-sm ${activeTableId === table.id ? 'bg-white text-indigo-700 shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}><FileTextIcon className="w-4 h-4" /><span>{table.title}</span></button>
                <button onClick={() => deleteScheduleTable(table.id)} className="absolute top-0 -right-1 p-0.5 bg-slate-200 text-slate-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><XIcon className="w-3 h-3"/></button>
              </div>
            ))}
            <button onClick={addScheduleTable} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-bold text-sm"><PlusIcon className="w-4 h-4" /> إضافة جدول</button>
          </div>

          {/* ACTIVE SCHEDULE CONTENT */}
          {activeTable ? (
            <div className="animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                    <table className="w-full border-collapse text-right">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-4 font-bold border-l border-slate-700 w-24">اليوم والتاريخ</th>
                        <th className="py-4 px-4 text-center font-bold border-l border-slate-700"><div className="flex items-center justify-center gap-2"><SunIcon className="w-4 h-4 text-yellow-400" /><span>صباحي</span></div></th>
                        <th className="py-4 px-4 text-center font-bold"><div className="flex items-center justify-center gap-2"><MoonIcon className="w-4 h-4 text-indigo-300" /><span>مسائي</span></div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(viewMode === 'weekly' ? weekDates : monthDates).map(date => renderScheduleCell(date))}
                    </tbody>
                    </table>
                </div>
            </div>
          ) : (
            <div className="text-center py-20 px-4 bg-white rounded-2xl shadow-sm border border-slate-200">
              <FileTextIcon className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-600">لا توجد جداول</h3>
              <p className="mt-2 text-sm text-slate-400">ابدأ بإضافة جدول جديد لتتمكن من تعيين السائقين.</p>
              <button onClick={addScheduleTable} className="mt-6 flex items-center mx-auto gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold shadow-md active:scale-95"><PlusIcon className="w-5 h-5" /> إضافة جدول جديد</button>
            </div>
          )}
        </div>
      </main>
      
      {/* MODALS */}
      {selectionModal && activeTable && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"><div className="bg-indigo-700 p-6 text-white flex justify-between items-start relative"><div className="relative z-10"><h3 className="text-xl font-bold">اختيار السائقين</h3><p className="text-indigo-100 text-xs mt-1">{DAY_NAME_MAP_AR[selectionModal.date.getDay()]} {formatDate(selectionModal.date)} - {selectionModal.shift === 'morning' ? 'مناوبة صباحية' : 'مناوبة مسائية'}</p></div><button onClick={() => setSelectionModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"><XIcon className="w-6 h-6" /></button></div><div className="p-2 bg-slate-50 max-h-[50vh] overflow-y-auto"><div className="p-2 space-y-2">{drivers.map(driver => { const isSelected = selectedDrivers.includes(driver.id); return (<button key={driver.id} onClick={() => toggleDriverSelection(driver.id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-white border-indigo-500 shadow-md' : 'border-transparent bg-white hover:border-indigo-200'}`}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{driver.name.charAt(0)}</div><span className={`font-bold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{driver.name}</span></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'}`}>{isSelected && <CheckIcon className="w-4 h-4 text-white" />}</div></button>);})}{drivers.length === 0 && <div className="p-8 text-center text-slate-400"><p>يرجى إضافة سائق أولاً</p></div>}</div></div><div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2"><button onClick={handleAssignDrivers} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"><UserCheckIcon className="w-5 h-5" />حفظ التعيينات ({selectedDrivers.length})</button><button onClick={() => setSelectedDrivers([])} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-5 rounded-xl transition-all text-sm">إلغاء تحديد الكل</button></div></div></div>}

      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full text-[10px] font-bold text-slate-500">
          <AlasaylLogo className="w-6 h-6" />
          <span>ISO-8601 Week Standard</span>
          <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
          <span>&copy; {currentYear} Alasayl-my-work</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
