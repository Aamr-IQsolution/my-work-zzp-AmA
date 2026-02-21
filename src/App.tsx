
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PlusIcon, TrashIcon, LogOutIcon, UserCheckIcon, 
  XIcon, SunIcon, MoonIcon, Share2Icon, 
  LockIcon, ChevronRightIcon, ChevronLeftIcon, CalendarDaysIcon, UsersIcon,
  FileTextIcon, Edit2Icon, CalendarIcon, CalendarRangeIcon,
  CheckIcon, UserCogIcon
} from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';
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
      src="https://alsail-transport.com/wp-content/uploads/2023/11/Alasayel-Logo-New-PNG.png" 
      alt="Alasayl Logo" 
      className="block w-full h-full object-contain"
    />
  </div>
);


// Define a type for the user profile data
interface UserProfile {
  id: string;
  email: string;
  role: string;
}



function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [newDriverName, setNewDriverName] = useState('');
  const [currentWeek, setCurrentWeek] = useState(getISOWeek(new Date()));
  const [currentYear, setCurrentYear] = useState(getCurrentYear());
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [editingDriverName, setEditingDriverName] = useState('');
  const [language, setLanguage] = useState<'ar' | 'nl'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [scheduleTables, setScheduleTables] = useState<ScheduleTable[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [activeTableId, setActiveTableId] = useState<number | null>(null);

  const SHIFT_OPTIONS: ShiftType[] = useMemo(() => [
    { name: language === 'ar' ? 'صباحي' : 'Ochtend', symbol: 'M' },
    { name: language === 'ar' ? 'مسائي' : 'Avond', symbol: 'A' },
    { name: language === 'ar' ? 'ليلي' : 'Nacht', symbol: 'N' },
    { name: language === 'ar' ? 'راحة' : 'Vrij', symbol: 'V' },
  ], [language]);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchUserRole = useCallback(async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error.message);
        if (error.message.includes('relation "profiles" does not exist')) {
            console.warn('Profiles table not found. Defaulting to user role.');
            setUserRole('user');
        }
        return;
      }
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Caught an exception while fetching user role:', error);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserRole(session.user);
      }
      setIsLoading(false);
    };
    
    getSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await fetchUserRole(session.user);
        } else {
          setUserRole(null);
        }
      }
    );
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const fetchActiveTableId = async () => {
    const { data, error } = await supabase
      .from('active_table')
      .select('table_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  
    if (data) {
      setActiveTableId(data.table_id);
    } else if (error && error.code !== 'PGRST116') { // Ignore "exact one row" error if no active table
      console.error('Error fetching active table:', error);
    }
  };
  
  const setActiveTable = async (tableId: number | null) => {
    if (!isAdmin) return;

    const { error: deleteError } = await supabase.from('active_table').delete().neq('id', -1);
    if (deleteError) {
        console.error("Error clearing active table:", deleteError);
        return;
    }

    if (tableId !== null) {
      const { error } = await supabase.from('active_table').insert({ table_id: tableId });
      if (error) {
        console.error("Error setting active table:", error);
      } else {
        setActiveTableId(tableId);
      }
    } else {
      setActiveTableId(null);
    }
  };

  const fetchScheduleTables = async () => {
    const { data, error } = await supabase.from('schedule_tables').select('*');
    if (error) {
      console.error("Error fetching schedule tables:", error);
    } else {
      setScheduleTables(data as ScheduleTable[]);
    }
  };
  
  useEffect(() => {
    if(session){
        fetchScheduleTables();
        fetchActiveTableId();
    }
  }, [session]);
  
  const addScheduleTable = async () => {
    if (!newTableName.trim() || !isAdmin) return;
    const { data, error } = await supabase.from('schedule_tables').insert({ name: newTableName }).select().single();
    if (error) {
      console.error("Error adding table:", error);
      alert(language === 'ar' ? 'فشل إضافة الجدول.' : 'Failed to add table.');
    } else {
      setScheduleTables([...scheduleTables, data as ScheduleTable]);
      setNewTableName('');
      if (scheduleTables.length === 0) {
         await setActiveTable(data.id);
      }
    }
  };
  
  const deleteScheduleTable = async (tableId: number) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الجدول؟' : 'Are you sure you want to delete this table?')) {
      const { error } = await supabase.from('schedule_tables').delete().eq('id', tableId);
      if (error) {
        console.error("Error deleting table:", error);
        alert(language === 'ar' ? 'فشل حذف الجدول.' : 'Failed to delete table.');
      } else {
        setScheduleTables(scheduleTables.filter(table => table.id !== tableId));
        if (activeTableId === tableId) {
          const remainingTables = scheduleTables.filter(table => table.id !== tableId);
          if (remainingTables.length > 0) {
            await setActiveTable(remainingTables[0].id);
          } else {
            await setActiveTable(null);
          }
        }
      }
    }
  };
  

  const dates = useMemo(() => {
    return getDatesForISOWeek(currentWeek, currentYear);
  }, [currentWeek, currentYear]);

  const fetchDriversAndSchedule = useCallback(async () => {
    if (!activeTableId) {
      setDrivers([]);
      setSchedule({});
      return;
    };

    const { data: driversData, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('table_id', activeTableId);

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
    } else {
      setDrivers(driversData as Driver[]);
    }

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('table_id', activeTableId)
      .eq('week_number', currentWeek)
      .eq('year', currentYear);
      
    if (scheduleError) {
      console.error('Error fetching schedule:', scheduleError);
    } else {
      const newSchedule: WeeklySchedule = {};
      scheduleData.forEach(entry => {
        if (!newSchedule[entry.driver_id]) {
          newSchedule[entry.driver_id] = {};
        }
        newSchedule[entry.driver_id][entry.date] = entry.shift;
      });
      setSchedule(newSchedule);
    }
  }, [activeTableId, currentWeek, currentYear]);

  useEffect(() => {
    if (session && activeTableId) {
      setIsLoading(true);
      fetchDriversAndSchedule().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [session, fetchDriversAndSchedule, activeTableId]);

  const handleAddDriver = async () => {
    if (newDriverName.trim() && isAdmin && activeTableId) {
      const { data, error } = await supabase
        .from('drivers')
        .insert([{ name: newDriverName.trim(), table_id: activeTableId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding driver:', error);
        alert(language === 'ar' ? 'فشل إضافة السائق.' : 'Failed to add driver.');
      } else {
        setDrivers(prevDrivers => [...prevDrivers, data as Driver]);
        setNewDriverName('');
      }
    }
  };

  const handleUpdateDriverName = async (driverId: number) => {
    if (editingDriverName.trim() && isAdmin) {
      const { data, error } = await supabase
        .from('drivers')
        .update({ name: editingDriverName.trim() })
        .eq('id', driverId)
        .select()
        .single();

      if (error) {
        console.error('Error updating driver name:', error);
      } else {
        setDrivers(drivers.map(d => d.id === driverId ? data as Driver : d));
        setEditingDriverId(null);
        setEditingDriverName('');
      }
    }
  };
  
  const handleDeleteDriver = async (driverId: number) => {
    if (isAdmin && window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السائق؟ سيتم حذف جميع جداوله أيضًا.' : 'Are you sure you want to delete this driver? All their schedules will be deleted as well.')) {
      const { error } = await supabase.from('drivers').delete().eq('id', driverId);
      if (error) {
        console.error('Error deleting driver:', error);
      } else {
        setDrivers(drivers.filter(d => d.id !== driverId));
        const newSchedule = { ...schedule };
        delete newSchedule[driverId];
        setSchedule(newSchedule);
      }
    }
  };

  const handleShiftChange = async (driverId: number, date: string, shift: ShiftType['symbol']) => {
      if (!isAdmin) {
          alert(language === 'ar' ? 'ليس لديك صلاحية لتغيير الجدول.' : "You don't have permission to change the schedule.");
          return;
      }

      const currentShift = schedule[driverId]?.[date];
      if (currentShift === shift) return;

      const { error } = await supabase.from('schedule').upsert(
          {
              driver_id: driverId,
              date,
              shift,
              week_number: currentWeek,
              year: currentYear,
              table_id: activeTableId
          },
          { onConflict: 'driver_id, date' }
      );

      if (error) {
          console.error('Error updating schedule:', error);
      } else {
          setSchedule(prev => ({
              ...prev,
              [driverId]: {
                  ...prev[driverId],
                  [date]: shift,
              },
          }));
      }
  };
  
  const changeWeek = (direction: 'next' | 'prev' | 'current') => {
    if (direction === 'current') {
      setCurrentWeek(getISOWeek(new Date()));
      setCurrentYear(getCurrentYear());
    } else {
      const newDate = new Date(currentYear, 0, 1 + (currentWeek - 1) * 7);
      if (direction === 'next') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
      setCurrentWeek(getISOWeek(newDate));
      setCurrentYear(newDate.getFullYear());
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setDrivers([]);
    setSchedule({});
    setScheduleTables([]);
    setActiveTableId(null);
  };

const generatePublicLink = () => {
    if (!activeTableId) return;
    const url = `${window.location.origin}/public/${activeTableId}`;
    navigator.clipboard.writeText(url).then(() => {
        alert(language === 'ar' ? 'تم نسخ الرابط العام!' : 'Public link copied!');
    }, () => {
        alert(language === 'ar' ? 'فشل نسخ الرابط.' : 'Failed to copy link.');
    });
};

const Sidebar = () => (
  <aside className={`bg-slate-100 dark:bg-slate-800 p-4 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <AlasaylLogo />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              نظام جدولة السائقين
            </h1>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{language === 'ar' ? 'الجداول' : 'Tables'}</h3>
        {scheduleTables.map(table => (
            <div key={table.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${activeTableId === table.id ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                onClick={() => setActiveTable(table.id)}
            >
                <span className="font-medium">{table.name}</span>
                {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); deleteScheduleTable(table.id); }} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        ))}
        {isAdmin && (
            <div className="flex items-center gap-2 mt-2">
                <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم جدول جديد...' : 'New table name...'}
                    className="flex-grow p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addScheduleTable()}
                />
                <button onClick={addScheduleTable} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      {isAdmin && (
        <>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-2">{language === 'ar' ? 'إضافة سائق جديد' : 'Add New Driver'}</h3>
              <div className="flex items-center gap-2">
                  <input
                      type="text"
                      value={newDriverName}
                      onChange={e => setNewDriverName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم السائق...' : 'Driver name...'}
                      className="flex-grow p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                      onKeyPress={e => e.key === 'Enter' && handleAddDriver()}
                  />
                  <button onClick={handleAddDriver} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                      <PlusIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setShowUserManagement(true)}
                className="w-full flex items-center gap-2 p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <UserCogIcon className="w-5 h-5" />
                <span>{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</span>
            </button>
          </div>
        </>
      )}
      
      <div className="mt-auto space-y-2">
         <button onClick={handleSignOut} className="w-full flex items-center gap-2 p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
            <LogOutIcon className="w-5 h-5" />
            <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
        </button>
      </div>
  </aside>
);

const MainContent = () => (
   <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:hidden">
                  {isSidebarOpen ? <XIcon/> : <ChevronRightIcon />}
              </button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-blue-500"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {activeTableId ? scheduleTables.find(t=>t.id === activeTableId)?.name : (language === 'ar' ? 'اختر جدولاً' : 'Select a table')}
                </h2>
              </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button onClick={() => changeWeek('prev')} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
              <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            </button>
            <div className="text-center w-48">
              <div className="font-semibold text-slate-700 dark:text-slate-200">{language === 'ar' ? `الأسبوع ${currentWeek}` : `Week ${currentWeek}`}</div>
              <div className="text-sm text-slate-500">{getMonthName(dates[0])} {dates[0].getFullYear()}</div>
            </div>
            <button onClick={() => changeWeek('next')} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
              <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            </button>
            <button onClick={() => changeWeek('current')} className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
              {language === 'ar' ? 'اليوم' : 'Today'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={generatePublicLink} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" title={language === 'ar' ? 'مشاركة' : 'Share'}>
                <Share2Icon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" title={language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}>
                {darkMode ? <SunIcon className="w-5 h-5 text-yellow-400"/> : <MoonIcon className="w-5 h-5 text-slate-600"/>}
            </button>
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'ar' | 'nl')} className="p-2 bg-transparent rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
                <option value="ar">العربية</option>
                <option value="nl">Nederlands</option>
            </select>
          </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">{language === 'ar' ? 'جاري تحميل الجدول...' : 'Loading schedule...'}</div>
      ) : !activeTableId ? (
         <div className="text-center py-10 text-slate-500">
             <p>{language === 'ar' ? 'الرجاء اختيار جدول من القائمة الجانبية لعرضه.' : 'Please select a table from the sidebar to display it.'}</p>
             {isAdmin && scheduleTables.length === 0 && <p className="mt-2">{language === 'ar' ? 'يمكنك إنشاء جدول جديد من القائمة الجانبية.' : 'You can create a new table from the sidebar.'}</p>}
         </div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
            <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="p-3 text-start text-sm font-semibold text-slate-600 dark:text-slate-300 w-48">{language === 'ar' ? 'السائق' : 'Driver'}</th>
                {dates.map((date, i) => (
                    <th key={date.toISOString()} className={`p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 ${isDateInPast(date) ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                        <div>{language === 'ar' ? DAY_NAME_MAP_AR[date.getDay()] : DAY_NAME_MAP_NL[date.getDay()]}</div>
                        <div>{formatDate(date)}</div>
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                {drivers.map(driver => (
                <tr key={driver.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <td className="p-2">
                        <div className="flex items-center gap-2">
                        {editingDriverId === driver.id ? (
                            <>
                            <input
                                type="text"
                                value={editingDriverName}
                                onChange={e => setEditingDriverName(e.target.value)}
                                onBlur={() => handleUpdateDriverName(driver.id)}
                                onKeyPress={e => e.key === 'Enter' && handleUpdateDriverName(driver.id)}
                                className="p-1 border rounded-md w-full bg-white dark:bg-slate-700"
                                autoFocus
                            />
                            <button onClick={() => handleUpdateDriverName(driver.id)} className="p-1 text-green-500"><CheckIcon className="w-4 h-4"/></button>
                            </>
                        ) : (
                            <>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{driver.name}</span>
                            {isAdmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingDriverId(driver.id); setEditingDriverName(driver.name); }} className="p-1 text-blue-500"><Edit2Icon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteDriver(driver.id)} className="p-1 text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            )}
                            </>
                        )}
                        </div>
                    </td>
                    {dates.map(date => (
                        <td key={date.toISOString()} className="p-0 text-center">
                          <ShiftSelector
                            currentShift={schedule[driver.id]?.[formatDate(date)]}
                            onSelect={shift => handleShiftChange(driver.id, formatDate(date), shift)}
                            isPast={isDateInPast(date)}
                            disabled={!isAdmin}
                          />
                        </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
    </div>
);

const ShiftSelector = ({ currentShift, onSelect, isPast, disabled }: { currentShift?: string, onSelect: (shift: string) => void, isPast: boolean, disabled: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    const shiftDisplay = SHIFT_OPTIONS.find(s => s.symbol === currentShift);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const getShiftColor = (symbol: string | undefined) => {
        switch (symbol) {
            case 'M': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'A': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'N': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
            case 'V': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-transparent';
        }
    };

    return (
        <div className="relative h-full" ref={ref}>
            <button 
                onClick={() => !disabled && setIsOpen(!isOpen)} 
                disabled={disabled}
                className={`w-full h-full flex items-center justify-center font-bold text-lg ${getShiftColor(currentShift)} ${isPast ? 'opacity-50' : ''} ${disabled ? 'cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
                {shiftDisplay?.symbol || <span className="text-slate-300 dark:text-slate-600"></span>}
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-1 min-w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700">
                    {SHIFT_OPTIONS.map(shift => (
                        <div
                            key={shift.symbol}
                            onClick={() => {
                                onSelect(shift.symbol);
                                setIsOpen(false);
                            }}
                            className="p-2 text-sm text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            {shift.name} ({shift.symbol})
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const getMonthName = (date: Date) => {
  const lang = document.documentElement.lang;
  return lang === 'ar' ? getMonthNameAR(date.getMonth()) : getMonthNameNL(date.getMonth());
};

 // --- User Management Modal ---
 useEffect(() => {
   if (!isAdmin) return;

   const fetchUsers = async () => {
     setLoading(true);
     // Attempt to fetch users directly from profiles table
     const { data, error } = await supabase.from('profiles').select('*');

     if (error) {
       console.error("Error fetching users:", error);
       alert(language === 'ar' ? 'فشل في جلب المستخدمين. تحقق من الكونسول.' : 'Failed to fetch users. Check console for details.');
     } else if (data) {
       // Assuming profiles table contains id, role, and email
       setUsers(data as UserProfile[]);
     }
     setLoading(false);
   };

   if (showUserManagement) {
     fetchUsers();
   }
 }, [showUserManagement, isAdmin, language]);

 const updateUserRole = async (userId: string, newRole: string) => {
   if (!isAdmin) return;
   // Prevent admin from changing their own role
   if (session && userId === session.user.id) {
       alert(language === 'ar' ? 'لا يمكنك تغيير دورك.' : 'You cannot change your own role.');
       return;
   }

   const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
   if (error) {
     console.error("Error updating user role:", error);
     alert(language === 'ar' ? 'فشل تحديث دور المستخدم.' : 'Failed to update user role.');
   } else {
     setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
   }
 };

const UserManagementModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h2>
                <button onClick={() => setShowUserManagement(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            {loading ? (
                <div>{language === 'ar' ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</div>
            ) : (
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="p-3">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                                <th className="p-3">{language === 'ar' ? 'الدور' : 'Role'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b dark:border-slate-700">
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                            disabled={session?.user.id === user.id}
                                            className="p-1 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
);
  
  if (!session) {
    return <Auth />;
  }

  return (
    <div className={`flex h-screen font-sans ${darkMode ? 'dark' : ''}`}>
      {showUserManagement && <UserManagementModal />}
      {isSidebarOpen && <Sidebar />}
      <MainContent />
    </div>
  );
}

export default App;
