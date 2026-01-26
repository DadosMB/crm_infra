import React from 'react';
import { LayoutDashboard, Trello, DollarSign, Settings, LogOut, FileText, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { User } from '../types';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: User;
  onLogout: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, setIsCollapsed, currentUser, onLogout }) => {
  return (
    <aside
      className={`
            flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-30 relative 
            border-r border-slate-200/60 dark:border-slate-800/60
            bg-white dark:bg-slate-900
            ${isCollapsed ? 'w-[90px]' : 'w-[280px]'}
        `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
      </button>

      {/* Brand Header */}
      <div className={`p-6 flex items-center mb-2 transition-all duration-500 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg shrink-0 group hover:scale-105 transition-transform">
          <div className="bg-white w-full h-full rounded-[10px] flex items-center justify-center p-1">
            <img
              src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png"
              alt="MenuBrands"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {!isCollapsed && (
          <div className="ml-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="font-bold text-lg tracking-tight leading-none text-slate-800 dark:text-white">MenuBrands</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wide">Infra CRM <span className="text-red-500">v1.0</span></p>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 py-4">
        {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 pl-3">Menu Principal</p>}
        <SidebarBtn view="dashboard" icon={LayoutDashboard} label="Dashboard" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="kanban" icon={Trello} label="Quadro de Ordens" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="tasks" icon={CheckSquare} label="Minhas Tarefas" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="finance" icon={DollarSign} label="Finanças" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="reports" icon={FileText} label="Relatórios" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
      </div>

      {/* Bottom Section */}
      <div className="p-4 mt-auto">
        <div className={`rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-2 transition-all duration-500 ${isCollapsed ? 'bg-transparent border-transparent p-0' : ''}`}>

          {/* Settings Link */}
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 ${currentView === 'settings' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            title="Configurações"
          >
            <Settings size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
          </button>

          {/* Divider */}
          {!isCollapsed && <div className="h-px bg-slate-200 dark:bg-slate-700 my-2 mx-2"></div>}

          {/* Profile Card */}
          <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${!isCollapsed ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm' : 'justify-center mt-2'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${!currentUser.avatarUrl ? currentUser.color : 'bg-gray-200 dark:bg-slate-700'} text-white shadow-md ring-2 ring-white dark:ring-slate-700`}>
              {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.initials} className="w-full h-full object-cover" />
              ) : (
                  currentUser.initials
              )}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800 dark:text-white leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">Online</p>
                </div>
              </div>
            )}

            {!isCollapsed && (
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

        {/* Collapsed Logout */}
        {isCollapsed && (
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
  );
};