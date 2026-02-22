
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusIcon, LogOutIcon, UserCheckIcon,
  XIcon, Share2Icon,
  FileTextIcon, CalendarIcon,
  UserCogIcon, DownloadIcon
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Driver, WeeklySchedule, ShiftType, DriverInfo, ScheduleTable as ScheduleTableType } from '../types.ts';
import { 
  getISOWeek, getCurrentYear, getDatesForISOWeek, isDateInPast,
  getDaysInMonth, formatDate
} from '../utils.ts';
import { supabase } from '../api/supabase';
import { useTranslations } from '../hooks/useTranslations';
import UserManagement from './UserManagement';
import { AlasaylLogo } from './common/AlasaylLogo';
import DriverList from './DriverList';
import ScheduleHeader from './ScheduleHeader';
import ScheduleTable from './ScheduleTable';
import DriverSelectionModal from './DriverSelectionModal';

const DAY_NAME_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAME_MAP_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

interface ScheduleAppProps {
  session: Session;
  language: 'ar' | 'nl';
  setLanguage: (language: 'ar' | 'nl') => void;
}

// Extend the window interface to include our event type
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const ScheduleApp: React.FC<ScheduleAppProps> = ({ session, language, setLanguage }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scheduleTables, setScheduleTables] = useState<ScheduleTableType[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputName, setInputName] = useState('');
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [editingDriverName, setEditingDriverName] = useState('');
  const [selectionModal, setSelectionModal] = useState<{ date: Date; shift: ShiftType } | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const t = useTranslations(language);
  const isAdmin = userRole === 'admin';
  
  const currentWeek = getISOWeek(currentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const weekDates = useMemo(() => getDatesForISOWeek(currentWeek, currentYear), [currentWeek, currentYear]);
  const monthDates = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear]);
  const activeTable = useMemo(() => scheduleTables.find(t => t.id === activeTableId), [scheduleTables, activeTableId]);
  
  const getDayKey = (date: Date) => date.toISOString().split('T')[0];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session.user) return;
      const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (error) {
        console.error('Error fetching user role:', error.message);
        setUserRole('user');
      } else if (data) {
        setUserRole(data.role);
      }
    };
    fetchUserRole();
  }, [session]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: driversData, error: driversError } = await supabase.from('drivers').select('*').order('name');
      if (driversError) console.error('Error fetching drivers:', driversError);
      else setDrivers(driversData || []);

      const { data: tablesData, error: tablesError } = await supabase.from('schedule_tables').select('*').order('created_at');
      if (tablesError) console.error('Error fetching schedule tables:', tablesError);
      else {
        setScheduleTables(tablesData.map(t => ({...t, schedule: {}})) || []);
        if (tablesData && tablesData.length > 0) {
          setActiveTableId(tablesData[0].id);
        }
      }
    };
    if(session) fetchInitialData();
  }, [session]);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!activeTableId) return;
      const dates = viewMode === 'weekly' ? weekDates : monthDates;
      const startDate = getDayKey(dates[0]);
      const endDate = getDayKey(dates[dates.length - 1]);

      const { data, error } = await supabase.from('schedule').select('*').eq('table_id', activeTableId).gte('date', startDate).lte('date', endDate);
      if (error) {
        console.error('Error fetching schedule data:', error);
        return;
      }
      
      const newSchedule: WeeklySchedule = {};
      data.forEach(entry => {
        const dayKey = entry.date;
        if (!newSchedule[dayKey]) newSchedule[dayKey] = {};
        newSchedule[dayKey][entry.shift] = { drivers: entry.drivers || [] };
      });

      setScheduleTables(prev => prev.map(t => t.id === activeTableId ? { ...t, schedule: newSchedule } : t));
    };
    if(activeTableId) fetchScheduleData();
  }, [activeTableId, currentDate, viewMode]);

  const addScheduleTable = async () => {
    if (!isAdmin) return;
    const newTitle = `${t.scheduleApp.newTableDefault} ${scheduleTables.length + 1}`;
    const { data, error } = await supabase.from('schedule_tables').insert({ title: newTitle }).select();
    if (error || !data) { console.error("Error adding table:", error); return; }
    const newTable: ScheduleTableType = {...data[0], schedule: {}};
    setScheduleTables(prev => [...prev, newTable]);
    setActiveTableId(newTable.id);
  };

  const deleteScheduleTable = async (idToDelete: string) => {
    if (!isAdmin || !confirm(t.general.confirmAction)) return;
    const { error } = await supabase.from('schedule_tables').delete().eq('id', idToDelete);
    if (error) { console.error("Error deleting table:", error); return; }
    setScheduleTables(prev => {
      const newTables = prev.filter(t => t.id !== idToDelete);
      if (activeTableId === idToDelete) setActiveTableId(newTables.length > 0 ? newTables[0].id : null);
      return newTables;
    });
  };

  const updateActiveTable = async (updates: Partial<Omit<ScheduleTableType, 'id' | 'schedule'>>) => {
    if (!isAdmin || !activeTableId) return;
    setScheduleTables(prev => prev.map(t => t.id === activeTableId ? { ...t, ...updates } : t));
    const { error } = await supabase.from('schedule_tables').update(updates).eq('id', activeTableId);
    if(error) console.error("Error updating table:", error);
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !inputName.trim()) return;
    const { data, error } = await supabase.from('drivers').insert({ name: inputName.trim() }).select();
    if (error || !data) { console.error("Error adding driver:", error); return; }
    setDrivers(prev => [data[0], ...prev]);
    setInputName('');
  };

  const handleStartEdit = (driver: Driver) => { setEditingDriverId(driver.id); setEditingDriverName(driver.name); };
  const handleCancelEdit = () => { setEditingDriverId(null); setEditingDriverName(''); };

  const handleSaveDriverName = async (driverId: number) => {
    if (!isAdmin) return;
    const newName = editingDriverName.trim();
    if (!newName) return alert(t.general.nameRequired);
    const { error } = await supabase.from('drivers').update({ name: newName }).eq('id', driverId);
    if (error) { console.error("Error updating driver:", error); return; }
    setDrivers(prev => prev.map(d => (d.id === driverId ? { ...d, name: newName } : d)));
    handleCancelEdit();
  };

  const handleDeleteDriver = async (id: number) => {
    if (!isAdmin || !confirm(t.general.confirmAction)) return;
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) { console.error("Error deleting driver:", error); return; }
    setDrivers(prev => prev.filter(d => d.id !== id));
  };
  
  const openSelectionModal = (date: Date, shift: ShiftType) => {
    if (!isAdmin || isDateInPast(date) || !activeTable) return;
    const dayKey = getDayKey(date);
    const currentDrivers = activeTable.schedule[dayKey]?.[shift]?.drivers.map(d => d.id) || [];
    setSelectedDrivers(currentDrivers);
    setSelectionModal({ date, shift });
  }

  const toggleDriverSelection = (driverId: number) => {
    setSelectedDrivers(prev => prev.includes(driverId) ? prev.filter(id => id !== driverId) : [...prev, driverId]);
  }

  const handleAssignDrivers = async () => {
    if (!isAdmin || !selectionModal || !activeTableId) return;
    const { date, shift } = selectionModal;
    const dayKey = getDayKey(date);
    const newDriverInfos: DriverInfo[] = drivers.filter(d => selectedDrivers.includes(d.id)).map(d => ({ id: d.id, name: d.name }));

    setScheduleTables(prev => prev.map(table => {
      if (table.id !== activeTableId) return table;
      const newSchedule: WeeklySchedule = { ...table.schedule };
      if (!newSchedule[dayKey]) newSchedule[dayKey] = {};
      newSchedule[dayKey][shift] = newDriverInfos.length > 0 ? { drivers: newDriverInfos } : null;
      return { ...table, schedule: newSchedule };
    }));
    
    setSelectionModal(null);
    setSelectedDrivers([]);

    const { error } = await supabase.from('schedule').upsert({ table_id: activeTableId, date: dayKey, shift: shift, drivers: newDriverInfos.length > 0 ? newDriverInfos : null }, { onConflict: 'table_id,date,shift' });
    if (error) console.error("Error assigning drivers:", error);
  };
  
  const handleShareToWhatsApp = useCallback(() => {
    if (!activeTable) return;
    const dates = viewMode === 'weekly' ? weekDates : monthDates;
    let message = `*${t.scheduleApp.whatsapp.schema}: ${activeTable.title}*\n`;
    if (activeTable.routeInfo) message += `*${t.scheduleApp.whatsapp.route}: ${activeTable.routeInfo}*\n`;
    message += '\n';
    const dayNameMap = language === 'ar' ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL;
    dates.forEach(date => {
        const dayKey = getDayKey(date);
        const dayName = dayNameMap[date.getDay()];
        const formattedDate = formatDate(date);
        const morningDrivers = activeTable.schedule[dayKey]?.morning?.drivers?.map(d => d.name).join(', ') || t.scheduleApp.whatsapp.noDriversAssigned;
        const eveningDrivers = activeTable.schedule[dayKey]?.evening?.drivers?.map(d => d.name).join(', ') || t.scheduleApp.whatsapp.noDriversAssigned;
        message += `*${dayName} - ${formattedDate}*\n`;
        message += `☀️ *${t.scheduleApp.morning}:* ${morningDrivers}\n`;
        message += `🌙 *${t.scheduleApp.evening}:* ${eveningDrivers}\n`;
        message += `-------------------\n`;
    });
    message += `\n${t.scheduleApp.whatsapp.generatedBy} Alasayl-my-work`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  }, [activeTable, viewMode, weekDates, monthDates, getDayKey, language, t]);

  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') newDate.setDate(newDate.getDate() + (offset * 7));
    else newDate.setMonth(newDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  if (userRole === null) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><AlasaylLogo className="w-24 h-24 mx-auto animate-pulse" /></div>;
  if (showUserManagement) return <UserManagement session={session} onBack={() => setShowUserManagement(false)} language={language} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className={`flex items-center gap-4 ${language === 'nl' && 'md:order-2'}`}>
            <AlasaylLogo className="w-12 h-12 md:w-16 md:h-16 border-2 border-indigo-500/50" />
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <h1 className="text-lg md:text-2xl font-bold uppercase">Alasayl-my-work</h1>
              <p className="text-indigo-100 text-[10px] md:text-xs opacity-80 font-medium">{t.scheduleApp.headerTitle}</p>
            </div>
          </div>
          
          <div className={`flex items-center flex-wrap gap-2 sm:gap-3 ${language === 'nl' && 'md:order-1'}`}>
            {deferredPrompt && (
              <button onClick={handleInstallClick} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-3 sm:px-4 py-2 rounded-xl border border-purple-400/30 transition-all">
                <DownloadIcon className="w-5 h-5" />
                <span className="font-bold text-sm hidden sm:inline">{t.general.addToHomeScreen}</span>
              </button>
            )}
            {isAdmin && <button onClick={() => setShowUserManagement(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 sm:px-4 py-2 rounded-xl border border-indigo-400/30 transition-all"><UserCogIcon className="w-5 h-5" /> <span className="font-bold text-sm hidden sm:inline">{t.scheduleApp.manageUsers}</span></button>}
            <button onClick={handleShareToWhatsApp} disabled={!activeTable} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 px-3 sm:px-4 py-2 rounded-xl border border-green-400/30 transition-all text-white"><Share2Icon className="w-5 h-5" /><span className="font-bold text-sm hidden sm:inline">WhatsApp</span></button>
            <button onClick={goToToday} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 sm:px-4 py-2 rounded-xl border border-indigo-400/30 transition-all"><CalendarIcon className="w-5 h-5" /> <span className="font-bold text-sm hidden sm:inline">{t.scheduleApp.today}</span></button>
            <div className="bg-indigo-900/50 rounded-xl p-1 flex items-center"><button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded-lg text-sm font-bold ${language === 'ar' ? 'bg-white text-indigo-700' : 'text-indigo-200'}`}>AR</button><button onClick={() => setLanguage('nl')} className={`px-3 py-1 rounded-lg text-sm font-bold ${language === 'nl' ? 'bg-white text-indigo-700' : 'text-indigo-200'}`}>NL</button></div>
            
            <div className={`text-sm ${language === 'ar' ? 'text-right' : 'text-left'} text-white border-s border-indigo-500/50 ps-3 ms-1`}>
              <p className="font-bold">{session.user.email?.split('@')[0]}</p>
              <p className="text-xs text-indigo-200 font-medium">{isAdmin ? t.userManagement.admin : t.userManagement.user}</p>
            </div>

            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl border border-red-400/30 transition-all"><LogOutIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <DriverList 
          drivers={drivers}
          isAdmin={isAdmin}
          language={language}
          inputName={inputName}
          setInputName={setInputName}
          handleAddDriver={handleAddDriver}
          editingDriverId={editingDriverId}
          editingDriverName={editingDriverName}
          setEditingDriverName={setEditingDriverName}
          handleStartEdit={handleStartEdit}
          handleSaveDriverName={handleSaveDriverName}
          handleCancelEdit={handleCancelEdit}
          handleDeleteDriver={handleDeleteDriver}
        />

        <div className={`lg:col-span-8 space-y-4 order-1 lg:order-2 ${!isAdmin ? 'lg:col-span-12' : ''}`}>
            
            <ScheduleHeader 
              viewMode={viewMode}
              currentWeek={currentWeek}
              currentMonth={currentMonth}
              currentYear={currentYear}
              language={language}
              changeDate={changeDate}
            />

          <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">{scheduleTables.map(table => (<div key={table.id} className="relative group"><button onClick={() => setActiveTableId(table.id)} className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 rounded-t-lg font-bold text-sm ${activeTableId === table.id ? 'bg-white text-indigo-700' : 'text-slate-500'}`}><FileTextIcon className="w-4 h-4" /><span>{table.title}</span></button>{isAdmin && <button onClick={() => deleteScheduleTable(table.id)} className={`absolute top-0 p-0.5 bg-slate-200 rounded-full opacity-0 group-hover:opacity-100 ${language === 'ar' ? '-right-1' : '-left-1'}`}><XIcon className="w-3 h-3"/ ></button>}</div>))}{isAdmin && <button onClick={addScheduleTable} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm"><PlusIcon className="w-4 h-4" /> {t.general.add}</button>}</div>

          {activeTable ? (
            <div>
                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 grid md:grid-cols-2 gap-4"><div><label className="text-sm font-bold">{t.scheduleApp.tableName}</label><input type="text" value={activeTable.title} onChange={(e) => updateActiveTable({ title: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div><div><label className="text-sm font-bold">{t.scheduleApp.routeInfo}</label><input type="text" value={activeTable.routeInfo || ''} onChange={(e) => updateActiveTable({ routeInfo: e.target.value })} placeholder="e.g., Ams - Utr" className="w-full px-3 py-2 rounded-lg border" /></div></div>
                )}
                <ScheduleTable 
                  activeTable={activeTable}
                  dates={viewMode === 'weekly' ? weekDates : monthDates}
                  language={language}
                  isAdmin={isAdmin}
                  openSelectionModal={openSelectionModal}
                />
            </div>
          ) : (
            <div className="text-center py-20 px-4 bg-white rounded-2xl shadow-sm border"><FileTextIcon className="w-12 h-12 mx-auto" /><h3 className="mt-4 text-lg font-bold">{t.scheduleApp.noTableSelected}</h3><p className="mt-2 text-sm">{t.scheduleApp.selectOrAddTable}</p>{isAdmin && <button onClick={addScheduleTable} className="mt-6 flex items-center mx-auto gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold"><PlusIcon className="w-5 h-5" /> {t.scheduleApp.addTable}</button>}</div>
          )}
        </div>
      </main>
      
      {isAdmin && selectionModal && (
        <DriverSelectionModal 
          isOpen={!!selectionModal}
          drivers={drivers}
          selectionModal={selectionModal}
          selectedDrivers={selectedDrivers}
          language={language}
          toggleDriverSelection={toggleDriverSelection}
          handleAssignDrivers={handleAssignDrivers}
          setSelectedDrivers={setSelectedDrivers}
        />
      )}

      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-[10px] font-bold text-slate-500"><div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full"><AlasaylLogo className="w-6 h-6" /><span>&copy; {currentYear} Alasayl-my-work</span></div></footer>
    </div>
  );
};

export default ScheduleApp;
