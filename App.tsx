
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, TrashIcon, CalendarIcon, UserCheckIcon, 
  XIcon, SunIcon, MoonIcon, CheckCircle2Icon, Share2Icon, 
  DownloadIcon, FileJsonIcon, CopyIcon, CheckIcon, UserIcon,
  LockIcon, ChevronRightIcon, ChevronLeftIcon, CalendarDaysIcon
} from 'lucide-react';
import { Driver, WeeklySchedule, ShiftType, ShiftAssignment } from './types';
import { getISOWeek, getCurrentYear, getDatesForISOWeek, formatDate, isDateInPast } from './utils';

const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

/**
 * AlasaylLogo: Displays the official circular brand logo provided by the user.
 */
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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [inputName, setInputName] = useState('');
  
  // Dynamic Week and Year
  const [currentWeek, setCurrentWeek] = useState<number>(getISOWeek(new Date()));
  const [currentYear, setCurrentYear] = useState<number>(getCurrentYear());
  
  const weekDates = useMemo(() => getDatesForISOWeek(currentWeek, currentYear), [currentWeek, currentYear]);

  // Modals State
  const [selectionModal, setSelectionModal] = useState<{ dayIndex: number; shift: ShiftType } | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [weekSelectorOpen, setWeekSelectorOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load data - Now specifically reacts to week/year changes
  useEffect(() => {
    const savedDrivers = localStorage.getItem('drivers_pool');
    const savedSchedule = localStorage.getItem(`schedule_w${currentWeek}_y${currentYear}`);
    
    if (savedDrivers) setDrivers(JSON.parse(savedDrivers));
    
    // Clear current schedule state before loading new one to avoid flash of old data
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    } else {
      setSchedule({});
    }
  }, [currentWeek, currentYear]);

  // Persistent driver pool (shared across all weeks)
  useEffect(() => {
    localStorage.setItem('drivers_pool', JSON.stringify(drivers));
  }, [drivers]);

  // Save specific week schedule
  useEffect(() => {
    if (Object.keys(schedule).length > 0) {
      localStorage.setItem(`schedule_w${currentWeek}_y${currentYear}`, JSON.stringify(schedule));
    }
  }, [schedule, currentWeek, currentYear]);

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name: inputName.trim(),
      addedAt: new Date().toISOString(),
    };
    setDrivers(prev => [newDriver, ...prev]);
    setInputName('');
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السائق؟ سيتم إزالته من جميع المناوبات أيضاً.')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
      const newSchedule = { ...schedule };
      Object.keys(newSchedule).forEach(day => {
        const dIdx = parseInt(day);
        if (newSchedule[dIdx].morning?.driverId === id) newSchedule[dIdx].morning = null;
        if (newSchedule[dIdx].evening?.driverId === id) newSchedule[dIdx].evening = null;
      });
      setSchedule(newSchedule);
    }
  };

  const assignDriver = (driver: Driver | null) => {
    if (!selectionModal) return;
    const { dayIndex, shift } = selectionModal;
    
    if (isDateInPast(weekDates[dayIndex])) {
        setSelectionModal(null);
        return;
    }

    setSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [shift]: driver ? { driverId: driver.id, driverName: driver.name } : null
      }
    }));
    setSelectionModal(null);
  };

  const handleWeekSelect = (week: number) => {
    setCurrentWeek(week);
    setWeekSelectorOpen(false);
  };

  const generateScheduleText = () => {
    let text = `📅 *جدول السائقين - الأسبوع ${currentWeek} (${currentYear})*\n`;
    text += `🏢 *Alasayl-my-work*\n\n`;
    DAYS_AR.forEach((day, idx) => {
      const dateStr = formatDate(weekDates[idx]);
      const morning = schedule[idx]?.morning?.driverName || 'غير محدد';
      const evening = schedule[idx]?.evening?.driverName || 'غير محدد';
      text += `📍 *${day} (${dateStr}):*\n☀️ صباحي: ${morning}\n🌙 مسائي: ${evening}\n\n`;
    });
    text += `تم التوليد بواسطة Alasayl-my-work 🐎`;
    return text;
  };

  const handleCopyToClipboard = async () => {
    const text = generateScheduleText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('فشل نسخ النص');
    }
  };

  const handleDownloadJSON = () => {
    const data = {
      week: currentWeek,
      year: currentYear,
      generatedAt: new Date().toISOString(),
      schedule: schedule,
      drivers: drivers
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alasayl_schedule_w${currentWeek}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AlasaylLogo className="w-16 h-16 border-2 border-indigo-500/50 shadow-2xl" />
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Alasayl-my-work</h1>
              <p className="text-indigo-100 text-[10px] md:text-xs opacity-80 font-medium">نظام جدولة السائقين المتكامل</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl border border-indigo-400/30 transition-all shadow-sm active:scale-95"
            >
              <Share2Icon className="w-5 h-5 text-indigo-100" />
              <span className="font-bold text-sm hidden sm:inline">تصدير / مشاركة</span>
            </button>

            {/* Clickable Week Selector Badge */}
            <button 
              onClick={() => setWeekSelectorOpen(true)}
              className="flex items-center gap-3 bg-indigo-800/50 hover:bg-indigo-800 px-4 py-2 rounded-xl border border-indigo-400/30 transition-all group active:scale-95"
            >
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-indigo-300 group-hover:text-indigo-200">الأسبوع</p>
                <p className="font-bold text-lg leading-none">{currentWeek}</p>
              </div>
              <CalendarDaysIcon className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PlusIcon className="w-4 h-4 text-indigo-600" />
                إضافة سائق جديد
              </h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleAddDriver} className="space-y-3">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="اسم السائق..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  حفظ السائق
                </button>
              </form>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">قائمة السائقين</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{drivers.length}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {drivers.length > 0 ? (
                drivers.map(driver => (
                  <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {driver.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{driver.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-sm">
                  لا يوجد سائقين مضافين
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="py-4 px-4 font-bold border-l border-slate-700 w-24">اليوم والتاريخ</th>
                  <th className="py-4 px-4 text-center font-bold border-l border-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <SunIcon className="w-4 h-4 text-yellow-400" />
                      <span>صباحي</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <MoonIcon className="w-4 h-4 text-indigo-300" />
                      <span>مسائي</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS_AR.map((day, idx) => {
                  const isPast = isDateInPast(weekDates[idx]);
                  return (
                    <tr key={idx} className={`transition-colors ${isPast ? 'bg-slate-100/50' : 'hover:bg-indigo-50/30'}`}>
                      <td className="py-6 px-4 bg-slate-50/80 border-l border-slate-100 min-w-[120px] relative">
                        <div className="flex items-center gap-1">
                          <p className={`font-bold ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>{day}</p>
                          {isPast && <LockIcon className="w-3 h-3 text-slate-300" />}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">{DAYS_NL[idx]}</p>
                        <p className={`text-[11px] font-bold mt-1 px-1 py-0.5 rounded inline-block ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                          {formatDate(weekDates[idx])}
                        </p>
                      </td>
                      
                      <td className="p-2 border-l border-slate-100">
                        <button
                          disabled={isPast}
                          onClick={() => !isPast && setSelectionModal({ dayIndex: idx, shift: 'morning' })}
                          className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1
                            ${isPast ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''}
                            ${!isPast && schedule[idx]?.morning 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' 
                              : !isPast ? 'border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-400' : ''}
                            ${isPast && schedule[idx]?.morning ? 'bg-slate-200 border-slate-300 text-slate-500 shadow-none' : ''}`}
                        >
                          {schedule[idx]?.morning ? (
                            <>
                              <UserCheckIcon className="w-4 h-4" />
                              <span className="font-bold text-sm text-center line-clamp-1">{schedule[idx].morning?.driverName}</span>
                            </>
                          ) : (
                            <span className="text-xs">{isPast ? 'مغلق' : '+ تعيين'}</span>
                          )}
                        </button>
                      </td>

                      <td className="p-2">
                        <button
                          disabled={isPast}
                          onClick={() => !isPast && setSelectionModal({ dayIndex: idx, shift: 'evening' })}
                          className={`w-full min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1
                            ${isPast ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''}
                            ${!isPast && schedule[idx]?.evening 
                              ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-lg' 
                              : !isPast ? 'border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500' : ''}
                            ${isPast && schedule[idx]?.evening ? 'bg-slate-700 border-slate-600 text-slate-400 shadow-none' : ''}`}
                        >
                          {schedule[idx]?.evening ? (
                            <>
                              <UserCheckIcon className="w-4 h-4 text-indigo-400" />
                              <span className="font-bold text-sm text-center line-clamp-1">{schedule[idx].evening?.driverName}</span>
                            </>
                          ) : (
                            <span className="text-xs">{isPast ? 'مغلق' : '+ تعيين'}</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Week Selector Modal */}
      {weekSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-700 p-6 text-white text-center relative">
              <h3 className="text-xl font-bold">اختر الأسبوع</h3>
              <div className="flex items-center justify-center gap-6 mt-4">
                <button 
                  onClick={() => setCurrentYear(y => y - 1)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <span className="font-bold text-lg">{currentYear}</span>
                <button 
                  onClick={() => setCurrentYear(y => y + 1)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => setWeekSelectorOpen(false)} 
                className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {Array.from({ length: 53 }, (_, i) => i + 1).map(week => (
                  <button
                    key={week}
                    onClick={() => handleWeekSelect(week)}
                    className={`aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all border-2
                      ${currentWeek === week 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600'}`}
                  >
                    {week}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setCurrentYear(getCurrentYear());
                    setCurrentWeek(getISOWeek(new Date()));
                    setWeekSelectorOpen(false);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all text-sm"
                >
                  العودة للأسبوع الحالي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Selection Modal */}
      {selectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-700 p-6 text-white flex justify-between items-center relative">
              <div className="relative z-10">
                <h3 className="text-xl font-bold">اختيار السائق</h3>
                <p className="text-indigo-100 text-xs mt-1">
                  {DAYS_AR[selectionModal.dayIndex]} ({formatDate(weekDates[selectionModal.dayIndex])}) - {selectionModal.shift === 'morning' ? 'مناوبة صباحية' : 'مناوبة مسائية'}
                </p>
              </div>
              <button onClick={() => setSelectionModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
                <XIcon className="w-6 h-6" />
              </button>
              <div className="absolute left-0 -bottom-6 opacity-10">
                  <AlasaylLogo className="w-32 h-32 rotate-12" />
              </div>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              <button
                onClick={() => assignDriver(null)}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all font-bold flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                إلغاء التعيين
              </button>
              
              <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 px-2 uppercase tracking-widest">اختر من القائمة</div>
              
              {drivers.length > 0 ? (
                drivers.map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => assignDriver(driver)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {driver.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{driver.name}</span>
                    </div>
                    <CheckCircle2Icon className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>لا يوجد سائقين مضافين حالياً</p>
                  <p className="text-xs mt-1">يرجى إضافة سائق أولاً من القائمة الجانبية</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">تصدير الجدول</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 mb-2">اختر الطريقة المفضلة لمشاركة أو حفظ الجدول:</p>
              
              <button
                onClick={handleCopyToClipboard}
                className="w-full p-5 rounded-2xl border-2 border-indigo-50 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center gap-4 group"
              >
                <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {copySuccess ? <CheckIcon className="w-6 h-6" /> : <CopyIcon className="w-6 h-6" />}
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-slate-800">{copySuccess ? 'تم النسخ بنجاح!' : 'نسخ النص (للواتساب)'}</p>
                  <p className="text-xs text-slate-500">نص منسق جاهز للإرسال الفوري</p>
                </div>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center gap-4 group"
              >
                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileJsonIcon className="w-6 h-6" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-slate-800">تحميل ملف JSON</p>
                  <p className="text-xs text-slate-500">نسخة احتياطية للبيانات والجدول</p>
                </div>
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
              <button 
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm uppercase tracking-widest"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-5xl mx-auto px-4 mt-12 text-center">
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
