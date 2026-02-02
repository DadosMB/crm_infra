
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ServiceOrder, PersonalTask, MaintenanceRecord, Expense, ExpenseStatus, OSStatus, User, Unit } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wrench, CheckSquare, Truck, DollarSign, Plus, Clock, MapPin, AlertCircle, X, Filter, ChevronDown, Check, LayoutGrid } from 'lucide-react';

interface CalendarViewProps {
  orders: ServiceOrder[];
  tasks: PersonalTask[];
  maintenanceRecords: MaintenanceRecord[];
  expenses: Expense[];
  onOpenOS: (order: ServiceOrder) => void;
  onAddTask: (date: string) => void; 
  currentUser: User;
}

type EventType = 'os' | 'task' | 'maintenance' | 'finance';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: EventType;
  status?: string;
  color: string;
  icon: any;
  refData: any; 
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// --- COMPONENTES AUXILIARES DE UI ---

const MultiSelectFilter = ({ 
    label, 
    options, 
    selected, 
    onChange, 
    onClear,
    icon: Icon
}: { 
    label: string; 
    options: string[]; 
    selected: string[]; 
    onChange: (value: string) => void; 
    onClear: () => void;
    icon?: any;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${selected.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                {Icon && <Icon size={14} className={selected.length > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />}
                {selected.length === 0 ? (
                    <span>{label}</span>
                ) : (
                    <span>{selected.length === 1 ? selected[0] : `${selected.length} selecionados`}</span>
                )}
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Filtrar {label}</span>
                        {selected.length > 0 && (
                            <button onClick={() => { onClear(); setIsOpen(false); }} className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                Limpar
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar space-y-0.5">
                        {options.map(option => {
                            const isSelected = selected.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => onChange(option)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    <span className="truncate">{option}</span>
                                    {isSelected && <Check size={12} className="shrink-0 ml-2" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const ModuleToggle = ({ 
    label, 
    active, 
    onClick, 
    colorClass,
    icon: Icon 
}: { 
    label: string; 
    active: boolean; 
    onClick: () => void; 
    colorClass: string;
    icon: any;
}) => (
    <button
        onClick={onClick}
        className={`
            px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95
            ${active 
                ? `${colorClass} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10` 
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
        `}
    >
        <Icon size={12} className={active ? 'opacity-100' : 'opacity-50'} />
        {label}
    </button>
);

const DatePickerPopover = ({ 
    currentDate, 
    onChange, 
    onClose 
}: { 
    currentDate: Date, 
    onChange: (date: Date) => void, 
    onClose: () => void 
}) => {
    const [viewYear, setViewYear] = useState(currentDate.getFullYear());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(viewYear, monthIndex, 1);
        onChange(newDate);
        onClose();
    };

    return (
        <div ref={ref} className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setViewYear(prev => prev - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><ChevronLeft size={16}/></button>
                <span className="font-bold text-slate-800 dark:text-white text-lg">{viewYear}</span>
                <button onClick={() => setViewYear(prev => prev + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><ChevronRight size={16}/></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {SHORT_MONTHS.map((m, idx) => (
                    <button
                        key={m}
                        onClick={() => handleMonthSelect(idx)}
                        className={`
                            py-2 rounded-lg text-sm font-medium transition-colors
                            ${idx === currentDate.getMonth() && viewYear === currentDate.getFullYear()
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                        `}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    orders, 
    tasks, 
    maintenanceRecords, 
    expenses, 
    onOpenOS,
    onAddTask,
    currentUser
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // --- FILTERS STATE ---
  const [activeModules, setActiveModules] = useState<EventType[]>(['os', 'task', 'maintenance', 'finance']);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const toggleModule = (type: EventType) => {
      setActiveModules(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
      if (list.includes(item)) setList(list.filter(i => i !== item));
      else setList([...list, item]);
  };

  // --- DATA MAPPING ---
  const events = useMemo(() => {
      const allEvents: CalendarEvent[] = [];

      // 1. Service Orders
      if (activeModules.includes('os')) {
          orders.forEach(os => {
              if (
                  os.dateForecast && 
                  os.status !== OSStatus.CONCLUIDA && 
                  os.status !== OSStatus.CANCELADA &&
                  (selectedUnits.length === 0 || selectedUnits.includes(os.unit)) &&
                  (selectedStatuses.length === 0 || selectedStatuses.includes(os.status))
              ) {
                  allEvents.push({
                      id: os.id,
                      date: os.dateForecast.split('T')[0],
                      title: `OS: ${os.title}`,
                      type: 'os',
                      status: os.status,
                      color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                      icon: Wrench,
                      refData: os
                  });
              }
          });
      }

      // 2. Personal Tasks
      if (activeModules.includes('task')) {
          tasks.filter(t => t.userId === currentUser.id && !t.completed).forEach(task => {
              if (task.dueDate) {
                  allEvents.push({
                      id: task.id,
                      date: task.dueDate.split('T')[0],
                      title: `Tarefa: ${task.title}`,
                      type: 'task',
                      status: task.priority,
                      color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
                      icon: CheckSquare,
                      refData: task
                  });
              }
          });
      }

      // 3. Maintenance Returns
      if (activeModules.includes('maintenance')) {
          maintenanceRecords.filter(m => m.active && m.dateReturnForecast).forEach(rec => {
              if (rec.dateReturnForecast) {
                  allEvents.push({
                      id: rec.id,
                      date: rec.dateReturnForecast.split('T')[0],
                      title: `Retorno: ${rec.providerName}`,
                      type: 'maintenance',
                      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                      icon: Truck,
                      refData: rec
                  });
              }
          });
      }

      // 4. Expenses
      if (activeModules.includes('finance')) {
          expenses.filter(e => e.status !== ExpenseStatus.PAGO).forEach(exp => {
              if (selectedUnits.length === 0 || selectedUnits.includes(exp.unit)) {
                  allEvents.push({
                      id: exp.id,
                      date: exp.date.split('T')[0],
                      title: `Pgto: ${exp.supplier}`,
                      type: 'finance',
                      color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
                      icon: DollarSign,
                      refData: exp
                  });
              }
          });
      }

      return allEvents;
  }, [orders, tasks, maintenanceRecords, expenses, currentUser, activeModules, selectedUnits, selectedStatuses]);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
      const today = new Date();
      setCurrentDate(today);
      setSelectedDate(today.toISOString().split('T')[0]);
  };

  const daysArray = useMemo(() => {
      const days = [];
      for (let i = 0; i < firstDay; i++) { days.push(null); }
      for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
      return days;
  }, [year, month, daysInMonth, firstDay]);

  const selectedEvents = events.filter(e => e.date === selectedDate);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 animate-in fade-in duration-500 pb-10">
        
        {/* MAIN CALENDAR GRID */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
            
            {/* Improved Header & Navigation */}
            <div className="flex flex-col border-b dark:border-slate-700">
                
                {/* Top Row: Title + Date Controls */}
                <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Agenda & Prazos</h2>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                        <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-xl text-slate-500 dark:text-slate-300 transition-all hover:shadow-sm"><ChevronLeft size={18} /></button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className="px-4 py-2 hover:bg-white dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-white font-bold text-sm transition-all hover:shadow-sm flex items-center gap-2 min-w-[140px] justify-center"
                            >
                                <CalendarIcon size={14} className="text-indigo-500" />
                                <span className="capitalize">{MONTHS[month]} {year}</span>
                                <ChevronDown size={12} className={`text-slate-400 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDatePickerOpen && (
                                <DatePickerPopover 
                                    currentDate={currentDate} 
                                    onChange={setCurrentDate} 
                                    onClose={() => setIsDatePickerOpen(false)} 
                                />
                            )}
                        </div>

                        <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-xl text-slate-500 dark:text-slate-300 transition-all hover:shadow-sm"><ChevronRight size={18} /></button>
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1"></div>
                        
                        <button onClick={goToToday} className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all">
                            Hoje
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Unified Filter Bar */}
                <div className="px-5 py-3 bg-gray-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-y-3 gap-x-6 items-center justify-between">
                    
                    {/* Module Toggles (Visual) */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Exibir:</span>
                        <ModuleToggle label="OS" icon={Wrench} active={activeModules.includes('os')} onClick={() => toggleModule('os')} colorClass="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" />
                        <ModuleToggle label="Tarefas" icon={CheckSquare} active={activeModules.includes('task')} onClick={() => toggleModule('task')} colorClass="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800" />
                        <ModuleToggle label="Finanças" icon={DollarSign} active={activeModules.includes('finance')} onClick={() => toggleModule('finance')} colorClass="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800" />
                        <ModuleToggle label="Patrimônio" icon={Truck} active={activeModules.includes('maintenance')} onClick={() => toggleModule('maintenance')} colorClass="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800" />
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex items-center gap-2 ml-auto">
                        <MultiSelectFilter 
                            label="Unidades"
                            icon={MapPin}
                            options={Object.values(Unit)}
                            selected={selectedUnits}
                            onChange={(val) => toggleSelection(val, selectedUnits, setSelectedUnits)}
                            onClear={() => setSelectedUnits([])}
                        />
                        <MultiSelectFilter 
                            label="Status OS"
                            icon={AlertCircle}
                            options={Object.values(OSStatus)}
                            selected={selectedStatuses}
                            onChange={(val) => toggleSelection(val, selectedStatuses, setSelectedStatuses)}
                            onClear={() => setSelectedStatuses([])}
                        />
                    </div>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
                {WEEKDAYS.map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-100 dark:bg-slate-700 gap-px border-b dark:border-slate-700">
                {daysArray.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="bg-white/50 dark:bg-slate-800/50" />;
                    
                    const dateStr = date.toISOString().split('T')[0];
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = selectedDate === dateStr;
                    const dayEvents = events.filter(e => e.date === dateStr);

                    return (
                        <div 
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                                relative bg-white dark:bg-slate-800 p-2 min-h-[100px] cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50
                                ${isSelected ? 'ring-2 ring-inset ring-indigo-500 z-10 bg-indigo-50/10 dark:bg-indigo-900/10' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`
                                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all
                                    ${isToday ? 'bg-red-600 text-white shadow-md scale-110' : 'text-slate-700 dark:text-slate-300'}
                                    ${isSelected && !isToday ? 'bg-indigo-600 text-white shadow-md' : ''}
                                `}>
                                    {date.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                        {dayEvents.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 mt-1 overflow-hidden">
                                {dayEvents.slice(0, 3).map((evt, idx) => (
                                    <div key={idx} className={`text-[9px] truncate px-1.5 py-0.5 rounded border ${evt.color} bg-opacity-20 border-opacity-30 flex items-center gap-1`}>
                                        <div className={`w-1 h-1 rounded-full bg-current shrink-0`} />
                                        {evt.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[9px] text-slate-400 text-center font-medium hover:text-indigo-500 transition-colors">+ {dayEvents.length - 3} itens</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* SIDE PANEL (DETAILS) */}
        <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col shrink-0 overflow-hidden">
            <div className="p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Agenda do Dia
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 capitalize font-medium">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Add Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onAddTask(selectedDate)}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-xs font-bold bg-slate-50/50 dark:bg-slate-800/50"
                    >
                        <Plus size={14} /> Nova Tarefa
                    </button>
                    {/* Placeholder */}
                    <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 text-xs font-bold cursor-not-allowed opacity-50">
                        Agendar Reunião
                    </div>
                </div>

                {selectedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500 opacity-60">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                            <CalendarIcon size={30} className="text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium">Nada agendado para este dia.</p>
                        <p className="text-xs mt-1">Selecione filtros ou adicione tarefas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedEvents.map(evt => (
                            <div 
                                key={evt.id} 
                                className={`p-4 rounded-xl border relative group transition-all hover:shadow-md ${evt.color} bg-opacity-5 dark:bg-opacity-10 border-opacity-60`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0 border border-slate-100 dark:border-slate-700`}>
                                        <evt.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h4 className="font-bold text-sm truncate text-slate-800 dark:text-slate-100" title={evt.title}>{evt.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">
                                                {evt.type === 'os' ? 'Ordem Serviço' : evt.type === 'finance' ? 'Financeiro' : evt.type === 'maintenance' ? 'Patrimônio' : 'Tarefa'}
                                            </span>
                                            {evt.status && <span className="text-[9px] font-semibold opacity-80 capitalize flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-current"/>{evt.status}</span>}
                                        </div>
                                    </div>
                                </div>

                                {evt.type === 'os' && (
                                    <button 
                                        onClick={() => onOpenOS(evt.refData)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/50 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 hover:shadow-sm"
                                        title="Abrir Detalhes"
                                    >
                                        <Clock size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
