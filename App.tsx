
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusIcon, TrashIcon, LogOutIcon, UserCheckIcon, 
  XIcon, SunIcon, MoonIcon, Share2Icon, 
  LockIcon, ChevronRightIcon, ChevronLeftIcon, CalendarDaysIcon, UsersIcon,
  FileTextIcon, Edit2Icon, CalendarIcon, CalendarRangeIcon,
  CheckIcon // Added CheckIcon for edit functionality
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Driver, WeeklySchedule, ShiftType, DriverInfo, ScheduleTable } from './types';
import { 
  getISOWeek, getCurrentYear, getDatesForISOWeek, formatDate, isDateInPast,
  getDaysInMonth, getMonthNameAR, getMonthNameNL
} from './utils';
import { supabase } from './api/supabase';
import Auth from './Auth';

const DAY_NAME_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAME_MAP_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];


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

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  } else {
    return <ScheduleApp session={session} />;
  }
}

// The main application is now its own component
const ScheduleApp: React.FC<{ session: Session }> = ({ session }) => {
  // Role & Permissions State
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAdmin = userRole === 'admin';

  // Core Data State
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scheduleTables, setScheduleTables] = useState<ScheduleTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  
  // View & Date State
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Language State
  const [language, setLanguage] = useState<'ar' | 'nl'>('ar');

  // Derived date values
  const currentWeek = getISOWeek(currentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Dates to render based on view mode
  const weekDates = useMemo(() => getDatesForISOWeek(currentWeek, currentYear), [currentWeek, currentYear]);
  const monthDates = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear]);

  // Input & Modal State
  const [inputName, setInputName] = useState('');
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [editingDriverName, setEditingDriverName] = useState('');
  const [selectionModal, setSelectionModal] = useState<{ date: Date; shift: ShiftType } | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  
  const activeTable = useMemo(() => scheduleTables.find(t => t.id === activeTableId), [scheduleTables, activeTableId]);
  
  const getDayKey = (date: Date) => date.toISOString().split('T')[0]; // "YYYY-MM-DD"

  // --- PERMISSIONS & DATA LOADING ---
  useEffect(() => {
    // Fetch user role first
    const fetchUserRole = async () => {
      if (!session.user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error.message);
        // Default to 'user' role on error for security
        setUserRole('user');
      } else if (data) {
        setUserRole(data.role);
      }
    };

    fetchUserRole();
  }, [session]);

  useEffect(() => {
    // Fetch initial data on component mount
    const fetchInitialData = async () => {
      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase.from('drivers').select('*').order('name');
      if (driversError) console.error('Error fetching drivers:', driversError);
      else setDrivers(driversData || []);

      // Fetch schedule tables
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

  // Effect to fetch schedule entries when view changes
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!activeTableId) return;

      const dates = viewMode === 'weekly' ? weekDates : monthDates;
      const startDate = getDayKey(dates[0]);
      const endDate = getDayKey(dates[dates.length - 1]);

      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('table_id', activeTableId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching schedule data:', error);
        return;
      }
      
      const newSchedule: WeeklySchedule = {};
      data.forEach(entry => {
        const dayKey = entry.date;
        if (!newSchedule[dayKey]) {
          newSchedule[dayKey] = {};
        }
        newSchedule[dayKey][entry.shift] = { drivers: entry.drivers || [] };
      });

      setScheduleTables(prev => 
        prev.map(t => t.id === activeTableId ? { ...t, schedule: newSchedule } : t)
      );
    };

    if(activeTableId) fetchScheduleData();
  }, [activeTableId, currentDate, viewMode]);


  // --- CRUD for Schedule Tables (Admin only) ---
  const addScheduleTable = async () => {
    if (!isAdmin) return;
    const newTitle = `${language === 'ar' ? 'جدول' : 'Tabel'} ${scheduleTables.length + 1}`;
    const { data, error } = await supabase.from('schedule_tables').insert({ title: newTitle }).select();
    
    if (error || !data) {
      console.error("Error adding schedule table:", error);
      return;
    }
    
    const newTable: ScheduleTable = {...data[0], schedule: {}};
    setScheduleTables(prev => [...prev, newTable]);
    setActiveTableId(newTable.id);
  };

  const deleteScheduleTable = async (idToDelete: string) => {
    if (!isAdmin) return;
    const confirmMessage = language === 'ar' ? 'هل أنت متأكد من حذف هذا الجدول؟' : 'Weet je zeker dat je deze tabel wilt verwijderen?';
    if (!confirm(confirmMessage)) return;

    const { error } = await supabase.from('schedule_tables').delete().eq('id', idToDelete);

    if (error) {
        console.error("Error deleting table:", error);
        return;
    }

    setScheduleTables(prev => {
      const newTables = prev.filter(t => t.id !== idToDelete);
      if (activeTableId === idToDelete) {
        setActiveTableId(newTables.length > 0 ? newTables[0].id : null);
      }
      return newTables;
    });
  };

  const updateActiveTable = async (updates: Partial<Omit<ScheduleTable, 'id' | 'schedule'>>) => {
    if (!isAdmin || !activeTableId) return;
    
    setScheduleTables(prev => prev.map(t => t.id === activeTableId ? { ...t, ...updates } : t));

    const { error } = await supabase.from('schedule_tables').update(updates).eq('id', activeTableId);
    if(error) {
        console.error("Error updating table:", error);
    }
  };

  // --- DRIVER & SCHEDULE LOGIC (Admin only for modifications) ---
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !inputName.trim()) return;

    const { data, error } = await supabase.from('drivers').insert({ name: inputName.trim() }).select();

    if (error || !data) {
        console.error("Error adding driver:", error);
        return;
    }
    setDrivers(prev => [data[0], ...prev]);
    setInputName('');
  };

  const handleStartEdit = (driver: Driver) => { setEditingDriverId(driver.id); setEditingDriverName(driver.name); };
  const handleCancelEdit = () => { setEditingDriverId(null); setEditingDriverName(''); };

  const handleSaveDriverName = async (driverId: number) => {
    if (!isAdmin) return;
    const newName = editingDriverName.trim();
    if (!newName) return alert(language === 'ar' ? "اسم السائق لا يمكن أن يكون فارغاً." : "Chauffeursnaam mag niet leeg zijn.");

    const { error } = await supabase.from('drivers').update({ name: newName }).eq('id', driverId);
    if (error) {
        console.error("Error updating driver name:", error);
        return;
    }
    
    setDrivers(prev => prev.map(d => (d.id === driverId ? { ...d, name: newName } : d)));
    
    handleCancelEdit();
  };

  const handleDeleteDriver = async (id: number) => {
    if (!isAdmin) return;
    const confirmMessage = language === 'ar' ? 'هل أنت متأكد من حذف هذا السائق؟' : 'Weet je zeker dat je deze chauffeur wilt verwijderen?';
    if (confirm(confirmMessage)) {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) {
            console.error("Error deleting driver:", error);
            return;
        }
        setDrivers(prev => prev.filter(d => d.id !== id));
    }
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

    const newDriverInfos: DriverInfo[] = drivers
      .filter(d => selectedDrivers.includes(d.id))
      .map(d => ({ id: d.id, name: d.name }));

    setScheduleTables(prev => prev.map(table => {
      if (table.id !== activeTableId) return table;
      const newSchedule: WeeklySchedule = { ...table.schedule };
      if (!newSchedule[dayKey]) newSchedule[dayKey] = {};
      newSchedule[dayKey][shift] = newDriverInfos.length > 0 ? { drivers: newDriverInfos } : null;
      return { ...table, schedule: newSchedule };
    }));
    
    setSelectionModal(null);
    setSelectedDrivers([]);

    const { error } = await supabase.from('schedule').upsert({
        table_id: activeTableId,
        date: dayKey,
        shift: shift,
        drivers: newDriverInfos.length > 0 ? newDriverInfos : null
    }, { onConflict: 'table_id,date,shift' });

    if (error) {
        console.error("Error assigning drivers:", error);
    }
  };
  
  // --- OTHER LOGIC (Read-only, available to all) ---
  const handleShareToWhatsApp = useCallback(() => {
    if (!activeTable) {
        alert(language === 'ar' ? 'يرجى تحديد جدول للمشاركة.' : 'Selecteer een tabel om te delen.');
        return;
    }
    const dates = viewMode === 'weekly' ? weekDates : monthDates;
    const isArabic = language === 'ar';
    let message = `*${isArabic ? 'جدول' : 'Schema'}: ${activeTable.title}*\n`;
    if (activeTable.routeInfo) {
        message += `*${isArabic ? 'الخط' : 'Route'}: ${activeTable.routeInfo}*\n`;
    }
    message += '\n';
    const dayNameMap = isArabic ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL;
    dates.forEach(date => {
        const dayKey = getDayKey(date);
        const dayName = dayNameMap[date.getDay()];
        const formattedDate = formatDate(date);
        const morningDrivers = activeTable.schedule[dayKey]?.morning?.drivers?.map(d => d.name).join(', ') || (isArabic ? 'لا يوجد' : 'Geen');
        const eveningDrivers = activeTable.schedule[dayKey]?.evening?.drivers?.map(d => d.name).join(', ') || (isArabic ? 'لا يوجد' : 'Geen');
        message += `*${dayName} - ${formattedDate}*\n`;
        message += `☀️ *${isArabic ? 'صباحي' : 'Ochtend'}:* ${morningDrivers}\n`;
        message += `🌙 *${isArabic ? 'مسائي' : 'Avond'}:* ${eveningDrivers}\n`;
        message += `-------------------\n`;
    });
    message += `\n${isArabic ? 'تم إنشاؤه بواسطة' : 'Gegenereerd door'} Alasayl-my-work`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }, [activeTable, viewMode, weekDates, monthDates, getDayKey, language]);

  const changeWeek = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      setCurrentDate(newDate);
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset, 1);
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
      const dayName = (language === 'ar' ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL)[date.getDay()];
      const morningDrivers = activeTable?.schedule[dayKey]?.morning?.drivers;
      const eveningDrivers = activeTable?.schedule[dayKey]?.evening?.drivers;
      const canEdit = isAdmin && !isPast;
      
      return (
        <tr key={dayKey} className={`transition-colors ${isPast ? 'bg-slate-100/50' : 'hover:bg-indigo-50/30'}`}>
          <td className="py-6 px-4 bg-slate-50/80 border-l border-slate-100 min-w-[120px] relative">
            <div className="flex items-center gap-1"><p className={`font-bold ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>{dayName}</p>{isPast && <LockIcon className="w-3 h-3 text-slate-300" />}</div>
            <p className={`text-[11px] font-bold mt-1 px-1 py-0.5 rounded inline-block ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>{formatDate(date)}</p>
          </td>
          <td className="p-2 border-l border-slate-100">
            <button disabled={!canEdit} onClick={() => openSelectionModal(date, 'morning')} className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''} ${canEdit && morningDrivers?.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' : canEdit ? 'border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-400' : ''} ${isPast && morningDrivers?.length ? 'bg-slate-200 border-slate-300 text-slate-500 shadow-none' : ''}`}>
              {morningDrivers?.length ? renderDriverNames(morningDrivers) : <span className="text-xs">{isPast ? (language === 'ar' ? 'مغلق' : 'Gesloten') : (canEdit ? (language === 'ar' ? '+ تعيين' : '+ Toewijzen') : (language === 'ar' ? 'عرض' : 'Bekijken'))}</span>}
            </button>
          </td>
          <td className="p-2">
            <button disabled={!canEdit} onClick={() => openSelectionModal(date, 'evening')} className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''} ${canEdit && eveningDrivers?.length ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-lg' : canEdit ? 'border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500' : ''} ${isPast && eveningDrivers?.length ? 'bg-slate-700 border-slate-600 text-slate-400 shadow-none' : ''}`}>
              {eveningDrivers?.length ? renderDriverNames(eveningDrivers) : <span className="text-xs">{isPast ? (language === 'ar' ? 'مغلق' : 'Gesloten') : (canEdit ? (language === 'ar' ? '+ تعيين' : '+ Toewijzen') : (language === 'ar' ? 'عرض' : 'Bekijken'))}</span>}
            </button>
          </td>
        </tr>
      );
  }

  // Show a loading indicator while fetching the user's role
  if (userRole === null) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="text-center">
                <AlasaylLogo className="w-24 h-24 mx-auto mb-4" />
                <p className="font-bold text-slate-600 animate-pulse">Loading User Permissions...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir={language === 'ar' ? 'rtl' : 'ltr'}>
       <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={`flex items-center gap-4 ${language === 'nl' && 'md:order-2'}`}>
            <AlasaylLogo className="w-16 h-16 border-2 border-indigo-500/50 shadow-2xl" />
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Alasayl-my-work</h1>
              <p className="text-indigo-100 text-[10px] md:text-xs opacity-80 font-medium">{language === 'ar' ? 'نظام جدولة السائقين المتكامل' : 'Geïntegreerd planningssysteem voor chauffeurs'}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 sm:gap-3 ${language === 'nl' && 'md:order-1'}`}>
             <button 
              onClick={handleShareToWhatsApp}
              disabled={!activeTable}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed px-3 sm:px-4 py-2 rounded-xl border border-green-400/30 transition-all shadow-sm active:scale-95 text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.001.004 4.274-1.118-1.021-3.226-.004-.012-.001-.004c-.295-.948-.271-2.036.069-2.986l.004-.01c.219-.586.583-1.123 1.041-1.572l.002-.002.002-.002c.254-.255.532-.483.829-.683l.003-.002.002-.001c.328-.219.684-.396 1.051-.525l.002-.001.002-.001c.532-.193 1.1-.288 1.665-.288.566 0 1.134.095 1.666.288l.002.001.002.001c.367.129.723.306 1.052.525l.002.001.003.002c.297.2.575.428.829.683l.002.002.002.002c.458.449.822.986 1.041 1.572l.004.01c.34.95.364 2.038.069 2.986l-.001.004-.004.012-1.022 3.226 4.275 1.118.001-.004c1.08-1.77 1.732-3.86 1.731-6.085-.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.063.59 4.027 1.592 5.719l.004.009z"/></svg>
              <span className="font-bold text-sm hidden sm:inline">WhatsApp</span>
            </button>
             <button 
              onClick={goToToday}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 sm:px-4 py-2 rounded-xl border border-indigo-400/30 transition-all shadow-sm active:scale-95"
            >
              <CalendarIcon className="w-5 h-5 text-indigo-100" />
              <span className="font-bold text-sm hidden sm:inline">{language === 'ar' ? 'اليوم' : 'Vandaag'}</span>
            </button>

            <div className="bg-indigo-900/50 rounded-xl p-1 flex items-center gap-1 border border-indigo-400/20">
                <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}><CalendarDaysIcon className="w-4 h-4" /> {language === 'ar' ? 'أسبوعي' : 'Wekelijks'}</button>
                <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}><CalendarRangeIcon className="w-4 h-4" /> {language === 'ar' ? 'شهري' : 'Maandelijks'}</button>
            </div>
            
            <div className="bg-indigo-900/50 rounded-xl p-1 flex items-center gap-1 border border-indigo-400/20">
                <button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${language === 'ar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}>AR</button>
                <button onClick={() => setLanguage('nl')} className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${language === 'nl' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10'}`}>NL</button>
            </div>
             <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 sm:px-4 py-2 rounded-xl border border-red-400/30 transition-all shadow-sm active:scale-95"
            >
              <LogOutIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Admin Controls & Driver List */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          {isAdmin && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><PlusIcon className="w-4 h-4 text-indigo-600" />{language === 'ar' ? 'إضافة سائق جديد' : 'Nieuwe chauffeur toevoegen'}</h3>
              </div>
              <div className="p-5">
                <form onSubmit={handleAddDriver} className="space-y-3">
                  <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder={language === 'ar' ? 'اسم السائق...' : 'Naam chauffeur...'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-95">{language === 'ar' ? 'حفظ السائق' : 'Chauffeur opslaan'}</button>
                </form>
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{language === 'ar' ? 'قائمة السائقين' : 'Lijst van chauffeurs'}</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{drivers.length}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {drivers.map(driver => (
                  <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    {isAdmin && editingDriverId === driver.id ? (
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
                        {isAdmin && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEdit(driver)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2Icon className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        )}
                      </>
                    )}
                  </div>
              ))}
              {drivers.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">{language === 'ar' ? 'لا يوجد سائقين مضافين' : 'Geen chauffeurs toegevoegd'}</div>}
            </div>
          </section>
        </div>

        {/* Right Column: Schedule View */}
        <div className={`lg:col-span-8 space-y-4 order-1 lg:order-2 ${!isAdmin ? 'lg:col-span-12' : ''}`}>
            {/* --- VIEW HEADER --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex justify-between items-center">
                <button onClick={() => viewMode === 'weekly' ? changeWeek(-1) : changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRightIcon className="w-6 h-6 text-slate-500" /></button>
                <div className="text-center">
                    {viewMode === 'weekly' ? (
                        <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'أسبوع' : 'Week'} {currentWeek}</h2>
                    ) : (
                        <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? getMonthNameAR(currentMonth) : getMonthNameNL(currentMonth)}</h2>
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
                {isAdmin && <button onClick={() => deleteScheduleTable(table.id)} className={`absolute top-0 p-0.5 bg-slate-200 text-slate-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all ${language === 'ar' ? '-right-1' : '-left-1'}`}><XIcon className="w-3 h-3"/ ></button>}
              </div>
            ))}
            {isAdmin && <button onClick={addScheduleTable} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-bold text-sm"><PlusIcon className="w-4 h-4" /> {language === 'ar' ? 'إضافة جدول' : 'Tabel toevoegen'}</button>}
          </div>

          {/* ACTIVE SCHEDULE CONTENT */}
          {activeTable ? (
            <div className="animate-in fade-in duration-300">
                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 grid md:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="table-title" className="text-sm font-bold text-slate-600 block mb-1">{language === 'ar' ? 'اسم الجدول' : 'Tabelnaam'}</label>
                          <input
                              id="table-title"
                              type="text"
                              value={activeTable.title}
                              onChange={(e) => updateActiveTable({ title: e.target.value })}
                              placeholder={language === 'ar' ? 'أدخل اسم الجدول' : 'Voer tabelnaam in'}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          />
                      </div>
                      <div>
                          <label htmlFor="route-info" className="text-sm font-bold text-slate-600 block mb-1">{language === 'ar' ? 'معلومات الطريق/الخط' : 'Route-informatie'}</label>
                          <input
                              id="route-info"
                              type="text"
                              value={activeTable.routeInfo || ''}
                              onChange={(e) => updateActiveTable({ routeInfo: e.target.value })}
                              placeholder="e.g., Amsterdam - Utrecht"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          />
                      </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                    <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-4 font-bold border-l border-slate-700 w-24">{language === 'ar' ? 'اليوم والتاريخ' : 'Dag & Datum'}</th>
                        <th className="py-4 px-4 text-center font-bold border-l border-slate-700"><div className="flex items-center justify-center gap-2"><SunIcon className="w-4 h-4 text-yellow-400" /><span>{language === 'ar' ? 'صباحي' : 'Ochtend'}</span></div></th>
                        <th className="py-4 px-4 text-center font-bold"><div className="flex items-center justify-center gap-2"><MoonIcon className="w-4 h-4 text-indigo-300" /><span>{language === 'ar' ? 'مسائي' : 'Avond'}</span></div></th>
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
              <h3 className="mt-4 text-lg font-bold text-slate-600">{language === 'ar' ? 'لم يتم تحديد جدول' : 'Geen tabel geselecteerd'}</h3>
              <p className="mt-2 text-sm text-slate-400">{language === 'ar' ? 'اختر جدولاً لعرضه، أو أضف جدولاً جديداً.' : 'Selecteer een tabel om te bekijken, of voeg een nieuwe toe.'}</p>
              {isAdmin && <button onClick={addScheduleTable} className="mt-6 flex items-center mx-auto gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold shadow-md active:scale-95"><PlusIcon className="w-5 h-5" /> {language === 'ar' ? 'إضافة جدول جديد' : 'Nieuwe tabel toevoegen'}</button>}
            </div>
          )}
        </div>
      </main>
      
      {/* MODALS (Admin only) */}
      {isAdmin && selectionModal && activeTable && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"><div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"><div className="bg-indigo-700 p-6 text-white flex justify-between items-start relative"><div className="relative z-10"><h3 className="text-xl font-bold">{language === 'ar' ? 'اختيار السائقين' : 'Selecteer chauffeurs'}</h3><p className="text-indigo-100 text-xs mt-1">{(language === 'ar' ? DAY_NAME_MAP_AR : DAY_NAME_MAP_NL)[selectionModal.date.getDay()]} {formatDate(selectionModal.date)} - {selectionModal.shift === 'morning' ? (language === 'ar' ? 'مناوبة صباحية' : 'Ochtenddienst') : (language === 'ar' ? 'مناوبة مسائية' : 'Avonddienst')}</p></div><button onClick={() => setSelectionModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"><XIcon className="w-6 h-6" /></button></div><div className="p-2 bg-slate-50 max-h-[50vh] overflow-y-auto"><div className="p-2 space-y-2">{drivers.map(driver => { const isSelected = selectedDrivers.includes(driver.id); return (<button key={driver.id} onClick={() => toggleDriverSelection(driver.id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'bg-white border-indigo-500 shadow-md' : 'border-transparent bg-white hover:border-indigo-200'}`}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{driver.name.charAt(0)}</div><span className={`font-bold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{driver.name}</span></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'}`}>{isSelected && <CheckIcon className="w-4 h-4 text-white" />}</div></button>);})}{drivers.length === 0 && <div className="p-8 text-center text-slate-400"><p>{language === 'ar' ? 'يرجى إضافة سائق أولاً' : 'Voeg eerst een chauffeur toe'}</p></div>}</div></div><div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2"><button onClick={handleAssignDrivers} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"><UserCheckIcon className="w-5 h-5" />{language === 'ar' ? 'حفظ التعيينات' : 'Toewijzingen opslaan'} ({selectedDrivers.length})</button><button onClick={() => setSelectedDrivers([])} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-5 rounded-xl transition-all text-sm">{language === 'ar' ? 'إلغاء تحديد الكل' : 'Alles deselecteren'}</button></div></div></div>}

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
