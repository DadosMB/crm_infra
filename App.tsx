
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Trello, DollarSign, Settings, PieChart, CheckSquare, Users as UsersIcon, LogOut, Briefcase, Store, Menu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { FinanceTable } from './components/FinanceTable';
import { OSModal } from './components/OSModal';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { TaskManager } from './components/TaskManager';
import { Sidebar } from './components/Sidebar';
import { UserManagementModal } from './components/UserManagementModal';
import { SupplierManagementModal } from './components/SupplierManagementModal';
import { ThemeToggle } from './components/ThemeToggle';
import { PerformanceToggle } from './components/PerformanceToggle';
import { ServiceOrder, Expense, OSStatus, User, PersonalTask, Notification, Supplier } from './types';
import { INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_TASKS, USERS, INITIAL_NOTIFICATIONS, INITIAL_SUPPLIERS } from './constants';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  // Auth State - RESET: Always start null (Login screen)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('light');

  // Performance Mode State
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
      const stored = localStorage.getItem('performanceMode');
      return stored === 'true';
  });

  // --- MOBILE DETECTION ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        if (mobile) setIsSidebarCollapsed(true); // Auto collapse on mobile
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data State - Source of Truth
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [tasks, setTasks] = useState<PersonalTask[]>(INITIAL_TASKS);
  const [users, setUsers] = useState<User[]>(USERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  
  // Management Modals State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // --- DATA SEGREGATION LOGIC (RBAC) ---
  // If Admin: See all. If User: See only own.
  
  const visibleOrders = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.isAdmin) return orders;
      return orders.filter(o => o.ownerId === currentUser.id);
  }, [orders, currentUser]);

  const visibleExpenses = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.isAdmin) return expenses;
      
      // Users only see expenses linked to their Visible Orders
      // Or expenses they created (if we tracked createdBy, but we rely on linkedOSId here)
      const visibleOrderIds = visibleOrders.map(o => o.id);
      return expenses.filter(e => e.linkedOSId && visibleOrderIds.includes(e.linkedOSId));
  }, [expenses, visibleOrders, currentUser]);

  const visibleTasks = useMemo(() => {
      if (!currentUser) return [];
      // Personal tasks are always personal, but admins might want to oversee?
      // For now, let's keep tasks strictly personal as per "Minhas Tarefas" concept.
      // But adhering to the prompt "Admin sees everything":
      if (currentUser.isAdmin) return tasks; 
      return tasks.filter(t => t.userId === currentUser.id);
  }, [tasks, currentUser]);


  // Effects
  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
  }, [theme]);

  useEffect(() => {
      if (performanceMode) {
          document.body.classList.add('performance-mode');
      } else {
          document.body.classList.remove('performance-mode');
      }
      localStorage.setItem('performanceMode', String(performanceMode));
  }, [performanceMode]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const togglePerformanceMode = () => {
      setPerformanceMode(prev => !prev);
  };

  // Handlers
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      if (user.isGuest) {
          setCurrentView('reports');
      } else {
          setCurrentView('dashboard');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setNotifications(INITIAL_NOTIFICATIONS); // Reset notifications on logout
  };

  // --- Notification Logic ---
  const addNotification = (notif: Omit<Notification, 'id' | 'date' | 'read'>) => {
      const newNotif: Notification = {
          ...notif,
          id: `notif-${Date.now()}`,
          date: new Date().toISOString(),
          read: false,
          userInitials: currentUser?.initials
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id?: string) => {
      setNotifications(prev => 
          prev.map(n => id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })
      );
  };

  // --- CRUD Handlers ---

  const handleOpenNewOS = () => {
    if (isMobile) {
        alert("Funcionalidade disponível apenas no desktop.");
        return;
    }
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOS = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOS = (order: ServiceOrder) => {
    if (isMobile) return;

    setOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      
      if (exists) {
        // Edit Mode
        if (exists.status !== order.status) {
             const log = { 
                id: Date.now().toString(), 
                date: new Date().toISOString(), 
                message: `Status alterado para: ${order.status} (${currentUser?.name})` 
             };
             order.history = [log, ...order.history];

             if (order.status === OSStatus.CONCLUIDA) {
                 addNotification({
                     title: 'OS Concluída',
                     message: `${currentUser?.name} concluiu a OS-${order.id}.`,
                     type: 'completed_os',
                     linkId: order.id
                 });
             }
        }
        return prev.map(o => o.id === order.id ? order : o);
      } else {
        // New Mode
        // Ensure Non-Admins strictly own the OS they create
        if (!currentUser?.isAdmin && order.ownerId !== currentUser?.id) {
            order.ownerId = currentUser!.id;
        }

        addNotification({
            title: 'Nova Ordem de Serviço',
            message: `${currentUser?.name} criou a OS-${order.id} em ${order.unit}.`,
            type: 'new_os',
            linkId: order.id
        });
        return [order, ...prev];
      }
    });
  };
  
  const handleArchiveOS = (order: ServiceOrder) => {
     if (isMobile) {
         alert("Funcionalidade disponível apenas no desktop.");
         return;
     }
     setOrders(prev => prev.map(o => {
         if (o.id === order.id) {
             const log = {
                 id: Date.now().toString(),
                 date: new Date().toISOString(),
                 message: `OS Documentada e Arquivada por ${currentUser?.name}`
             };
             return { ...o, archived: true, history: [log, ...o.history] };
         }
         return o;
     }));
  };

  const handleAddExpense = (expense: Expense) => {
    if (isMobile) {
        alert("Funcionalidade disponível apenas no desktop.");
        return;
    }
    setExpenses(prev => [expense, ...prev]);
    addNotification({
        title: 'Novo Gasto Registrado',
        message: `R$ ${expense.value} em ${expense.category} por ${currentUser?.name}.`,
        type: 'finance',
        linkId: expense.id
    });
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    if (isMobile) return;
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const handleBatchUpdateExpenses = (updatedExpenses: Expense[]) => {
      if (isMobile) return;
      setExpenses(prev => {
          const newExpenses = [...prev];
          updatedExpenses.forEach(updated => {
              const index = newExpenses.findIndex(e => e.id === updated.id);
              if (index !== -1) {
                  newExpenses[index] = updated;
              }
          });
          return newExpenses;
      });
  };

  const handleDeleteExpense = (id: string) => {
    if (isMobile) {
        alert("Funcionalidade disponível apenas no desktop.");
        return;
    }
    // Security: Non-Admins cannot delete expenses
    if (!currentUser?.isAdmin) {
        alert("Apenas administradores podem excluir despesas.");
        return;
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };
  
  const handleOpenOSFromFinance = (id: string) => {
      const order = visibleOrders.find(o => o.id === id); // Check against visible
      if (order) {
          handleEditOS(order);
      } else {
          alert('OS não encontrada ou sem permissão de acesso.');
      }
  };

  // Task Handlers
  const handleAddTask = (task: PersonalTask) => {
      setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: PersonalTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleToggleTask = (taskId: string) => {
      setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
  };

  const handleDeleteTask = (taskId: string) => {
      if (isMobile) {
          alert("Funcionalidade disponível apenas no desktop.");
          return;
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // User Management Handlers (Admin Only)
  const handleUpdateUser = (updatedUser: User) => {
      if (isMobile) return;
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  const handleDeleteUser = (userId: string) => {
      if (isMobile) return;
      if (!currentUser?.isAdmin) return;
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Supplier Management Handlers (Admin Only)
  const handleAddSupplier = (supplier: Supplier) => {
      if (isMobile) return;
      if (!currentUser?.isAdmin) {
          alert("Necessário permissão administrativa.");
          return;
      }
      setSuppliers(prev => [...prev, supplier]);
  };
  const handleUpdateSupplier = (updated: Supplier) => {
      if (isMobile) return;
      if (!currentUser?.isAdmin) return;
      setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSupplier = (id: string) => {
      if (isMobile) return;
      if (!currentUser?.isAdmin) return;
      setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // --- RENDER ---

  if (!currentUser) {
      return (
        <Login 
            onLogin={handleLogin} 
            users={users} 
            theme={theme}
            toggleTheme={toggleTheme}
            performanceMode={performanceMode}
            togglePerformanceMode={togglePerformanceMode}
        />
      );
  }

  // Guest/Executive View
  if (currentUser.isGuest) {
      return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-sans transition-colors duration-300">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg">
                        <Briefcase className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Portal Executivo</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Visualização Simplificada</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <PerformanceToggle isActive={performanceMode} toggle={togglePerformanceMode} />
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors">
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                <Reports 
                    orders={orders} // Executive sees all
                    expenses={expenses} 
                    isDarkMode={theme === 'dark'} 
                    suppliers={suppliers} 
                    onOpenOS={handleEditOS}
                    onUpdateExpenses={handleBatchUpdateExpenses}
                    currentUser={currentUser}
                    isMobile={isMobile}
                />
            </main>
        </div>
      );
  }

  // Main App View
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        isMobile={isMobile}
      />

      <main className="flex-1 overflow-auto flex flex-col w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-4 md:px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0 transition-all">
            <div className="flex items-center gap-3">
                {isMobile && (
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Menu size={24} />
                    </button>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight truncate max-w-[200px] md:max-w-none">
                    {currentView === 'kanban' ? 'Quadro de Ordens' : 
                     currentView === 'dashboard' ? 'Dashboard Geral' :
                     currentView === 'finance' ? 'Gestão Financeira' :
                     currentView === 'reports' ? 'Relatórios' :
                     currentView === 'tasks' ? 'Minhas Tarefas' :
                     currentView === 'settings' ? 'Configurações' : currentView}
                </h2>
            </div>
            <div className="flex gap-2 md:gap-4 items-center">
                <PerformanceToggle isActive={performanceMode} toggle={togglePerformanceMode} />
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full flex-1">
          {currentView === 'dashboard' && (
              <Dashboard 
                orders={visibleOrders} 
                expenses={visibleExpenses} 
                isDarkMode={theme === 'dark'} 
                onNavigate={setCurrentView} 
              />
          )}
          {currentView === 'kanban' && (
            <KanbanBoard 
                orders={visibleOrders.filter(o => !o.archived)}
                expenses={visibleExpenses}
                onOrderClick={handleEditOS} 
                onOrderUpdate={handleSaveOS}
                onNewOrder={handleOpenNewOS}
                onArchiveOrder={handleArchiveOS}
                isMobile={isMobile}
            />
          )}
          {currentView === 'finance' && (
              <FinanceTable 
                  expenses={visibleExpenses.filter(e => {
                      const linkedOS = visibleOrders.find(o => o.id === e.linkedOSId);
                      return !linkedOS?.archived; // Active finance
                  })} 
                  orders={visibleOrders.filter(o => !o.archived)} 
                  onAddExpense={handleAddExpense} 
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense} 
                  onOpenOS={handleOpenOSFromFinance} 
                  suppliers={suppliers}
                  onAddSupplier={handleAddSupplier}
                  isMobile={isMobile}
                  currentUser={currentUser}
              />
          )}
          
          {currentView === 'reports' && (
             <Reports 
                orders={visibleOrders} 
                expenses={visibleExpenses} 
                isDarkMode={theme === 'dark'} 
                suppliers={suppliers}
                onOpenOS={handleEditOS}
                onUpdateExpenses={handleBatchUpdateExpenses}
                currentUser={currentUser}
                isMobile={isMobile}
             />
          )}

          {currentView === 'tasks' && (
              <TaskManager 
                  tasks={visibleTasks}
                  currentUser={currentUser}
                  orders={visibleOrders}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenOS={handleOpenOSFromFinance}
                  isMobile={isMobile}
              />
          )}

          {currentView === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Preferências</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">Tema da Interface</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alternar entre modo claro e escuro.</p>
                            </div>
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>
                 </div>

                 {/* Permission Based Sections */}
                 <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${isMobile || !currentUser.isAdmin ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Prestadores {!currentUser.isAdmin ? '(Admin)' : isMobile ? '(Desktop)' : ''}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Cadastre e organize a lista de prestadores para facilitar o lançamento de despesas.
                    </p>
                    <button 
                        onClick={() => setIsSupplierModalOpen(true)}
                        disabled={!currentUser.isAdmin}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                        <Store size={18} />
                        Gerenciar Prestadores
                    </button>
                 </div>

                 <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${isMobile ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Usuários {isMobile && '(Desktop)'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {currentUser.isAdmin 
                            ? 'Gerencie perfis, permissões e adicione novos membros à equipe.' 
                            : 'Gerencie seu perfil, altere sua senha ou foto de exibição.'}
                    </p>
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <UsersIcon size={18} />
                        {currentUser.isAdmin ? 'Acessar Lista de Usuários' : 'Editar Meu Perfil'}
                    </button>
                 </div>
             </div>
          )}
        </div>
      </main>

      <OSModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder} 
        onSave={handleSaveOS}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        currentUser={currentUser}
        suppliers={suppliers}
        onAddSupplier={handleAddSupplier}
        isMobile={isMobile}
      />

      <UserManagementModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      <SupplierManagementModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={suppliers}
        onAddSupplier={handleAddSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteSupplier={handleDeleteSupplier}
      />
    </div>
  );
}

export default App;
