
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Trello, DollarSign, Settings, LogOut, FileText, ChevronLeft, ChevronRight, CheckSquare, Bell, CheckCircle2, AlertCircle, FileCheck, Moon, Sun, Box } from 'lucide-react';
import { User, Notification, NotificationType } from '../types';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings' | 'assets';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id?: string) => void;
  isMobile?: boolean;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

const SidebarBtn = ({ view, icon: Icon, label, currentView, setCurrentView, isCollapsed }: { view: View, icon: any, label: string, currentView: View, setCurrentView: (v: View) => void, isCollapsed: boolean }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => setCurrentView(view)}
      title={isCollapsed ? label : ''}
      className={`
            w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 group relative mb-1.5
            ${isActive
          ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 translate-x-1'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'}
            ${isCollapsed ? 'justify-center px-0' : ''}
        `}
    >
      <Icon size={20} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

      {!isCollapsed && (
        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 origin-left ${isActive ? 'font-bold' : ''}`}>
          {label}
        </span>
      )}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    isCollapsed, 
    setIsCollapsed, 
    currentUser, 
    onLogout, 
    notifications, 
    onMarkAsRead,
    isMobile = false,
    theme,
    toggleTheme
}) => {
  // ... (Notification logic unchanged) ...
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
          if (mobileNotificationRef.current && !mobileNotificationRef.current.contains(event.target as Node)) {
              setShowMobileNotifications(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const relevantNotifications = notifications.filter(n => {
      if (currentUser.isAdmin) return true;
      if (n.type === 'finance') return false; 
      return true;
  });

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const getIcon = (type: NotificationType) => {
      switch(type) {
          case 'new_os': return <AlertCircle size={16} className="text-blue-500" />;
          case 'completed_os': return <CheckCircle2 size={16} className="text-emerald-500" />;
          case 'finance': return <DollarSign size={16} className="text-amber-500" />;
          default: return <Bell size={16} className="text-slate-500" />;
      }
  };

  const getTimeAgo = (dateStr: string) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
  };

  return (
    <>
    {isMobile && !isCollapsed && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
            onClick={() => setIsCollapsed(true)}
        ></div>
    )}

    <aside
      className={`
            flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-30 
            border-r border-slate-200/60 dark:border-slate-800/60
            bg-white dark:bg-slate-900
            ${isMobile ? 'fixed top-0 bottom-0 left-0 h-full' : 'relative'}
            ${isCollapsed ? (isMobile ? '-translate-x-full w-[280px]' : 'w-[90px]') : 'w-[280px] translate-x-0'}
        `}
    >
      {!isMobile && (
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 z-50 cursor-pointer"
        >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>
      )}

      {/* HEADER WITH MOBILE NOTIFICATIONS */}
      <div className={`p-6 flex items-center justify-between mb-2 transition-all duration-500 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
        <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg shrink-0 group hover:scale-105 transition-transform">
            <div className="bg-white w-full h-full rounded-[10px] flex items-center justify-center p-1">
                <img
                src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png"
                alt="MenuBrands"
                className="w-full h-full object-contain"
                />
            </div>
            </div>

            {(!isCollapsed || isMobile) && (
            <div className="ml-3 animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="font-bold text-lg tracking-tight leading-none text-slate-800 dark:text-white">MenuBrands</h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wide">Infra CRM <span className="text-red-500">v1.0</span></p>
            </div>
            )}
        </div>

        {/* MOBILE NOTIFICATION BUTTON */}
        {isMobile && (
            <div className="relative" ref={mobileNotificationRef}>
                <button 
                    onClick={() => setShowMobileNotifications(!showMobileNotifications)}
                    className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm ml-2"
                >
                    <Bell size={18} className={unreadCount > 0 ? "animate-pulse text-indigo-500" : ""} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                    )}
                </button>

                {showMobileNotifications && (
                    <div className="absolute top-full left-0 mt-2 w-64 -ml-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200">
                        {/* ... Mobile notifications content ... */}
                        <div className="p-3 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs">Notificações</h4>
                            <button onClick={() => { onMarkAsRead(); setShowMobileNotifications(false); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 uppercase tracking-wide">
                                Limpar
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {relevantNotifications.length > 0 ? (
                                <div className="divide-y dark:divide-slate-800">
                                    {relevantNotifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-2 relative group ${!notif.read ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                                            onClick={() => onMarkAsRead(notif.id)}
                                        >
                                            <div className={`p-1.5 rounded-lg h-fit shrink-0 ${notif.type === 'new_os' ? 'bg-blue-100 dark:bg-blue-900/20' : notif.type === 'completed_os' ? 'bg-emerald-100 dark:bg-emerald-900/20' : notif.type === 'finance' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{getIcon(notif.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-white line-clamp-1">{notif.title}</h5>
                                                    <span className="text-[9px] text-slate-400 whitespace-nowrap ml-1">{getTimeAgo(notif.date)}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-slate-400">
                                    <Bell className="w-5 h-5 mx-auto mb-2 opacity-20" />
                                    <p className="text-[10px]">Tudo limpo por aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 py-4">
        {(!isCollapsed || isMobile) && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 pl-3">Menu Principal</p>}
        <SidebarBtn view="dashboard" icon={LayoutDashboard} label="Dashboard" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
        <SidebarBtn view="kanban" icon={Trello} label="Quadro de Ordens" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
        <SidebarBtn view="tasks" icon={CheckSquare} label="Minhas Tarefas" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
        <SidebarBtn view="finance" icon={DollarSign} label="Finanças" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
        <SidebarBtn view="reports" icon={FileText} label="Relatórios" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
        <SidebarBtn view="assets" icon={Box} label="Patrimônio" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed && !isMobile} />
      </div>

      <div className="p-4 mt-auto space-y-3">
        {/* ... (Notifications and Theme Toggle code unchanged) ... */}
        {!isMobile && (
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group
                        ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title="Notificações"
                >
                    <div className="relative">
                        <Bell size={20} className={unreadCount > 0 ? "animate-pulse-slow" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-900">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && <span className="text-sm font-medium">Notificações</span>}
                </button>

                {showNotifications && (
                    <div className="absolute left-0 bottom-full mb-4 w-72 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                       {/* Notifications Popover Content */}
                       <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h4 className="font-bold text-slate-800 dark:text-white">Notificações</h4>
                            <button onClick={() => onMarkAsRead()} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 uppercase tracking-wide">
                                Marcar lidas
                            </button>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {relevantNotifications.length > 0 ? (
                                <div className="divide-y dark:divide-slate-800">
                                    {relevantNotifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 relative group ${!notif.read ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                                            onClick={() => onMarkAsRead(notif.id)}
                                        >
                                            {!notif.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-red-500"></div>}
                                            <div className={`p-2 rounded-xl h-fit shrink-0 ${notif.type === 'new_os' ? 'bg-blue-100 dark:bg-blue-900/20' : notif.type === 'completed_os' ? 'bg-emerald-100 dark:bg-emerald-900/20' : notif.type === 'finance' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{getIcon(notif.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{notif.title}</h5>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{getTimeAgo(notif.date)}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Nenhuma notificação relevante.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* THEME TOGGLE (MOBILE ONLY) - Replaces Notification Button Position */}
        {isMobile && toggleTheme && (
            <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            >
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="text-sm font-medium">Modo {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            </button>
        )}

        <div className={`rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-2 transition-all duration-500 ${isCollapsed && !isMobile ? 'bg-transparent border-transparent p-0' : ''}`}>
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 ${currentView === 'settings' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : ''} ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
            title="Configurações"
          >
            <Settings size={20} />
            {(!isCollapsed || isMobile) && <span className="text-sm font-medium">Configurações</span>}
          </button>

          {(!isCollapsed || isMobile) && <div className="h-px bg-slate-200 dark:bg-slate-700 my-2 mx-2"></div>}

          <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${!isCollapsed || isMobile ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm' : 'justify-center mt-2'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${!currentUser.avatarUrl ? currentUser.color : 'bg-gray-200 dark:bg-slate-700'} text-white shadow-md ring-2 ring-white dark:ring-slate-700`}>
              {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.initials} className="w-full h-full object-cover" />
              ) : (
                  currentUser.initials
              )}
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800 dark:text-white leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">Online {currentUser.isAdmin && '(Admin)'}</p>
                </div>
              </div>
            )}

            {(!isCollapsed || isMobile) && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {isCollapsed && !isMobile && (
          <button
            onClick={onLogout}
            className="w-full mt-2 p-3 text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
