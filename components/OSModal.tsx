
import React, { useState, useEffect, useRef } from 'react';
import { ServiceOrder, OSStatus, OSPriority, Unit, OSType, HistoryLog, Expense, User, ExpenseCategory, PaymentMethod, Supplier } from '../types';
import { USERS } from '../constants';
import { X, Save, MessageSquare, Calendar, ArrowRightLeft, Plus, DollarSign, Trash2, AlertOctagon, Send, Clock, MapPin, Wrench, Paperclip, User as UserIcon, Lock, Search, Check } from 'lucide-react';

interface OSModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onSave: (order: ServiceOrder) => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  currentUser: User;
  suppliers?: Supplier[];
  onAddSupplier?: (supplier: Supplier) => void;
  isMobile?: boolean;
}

const STATUS_STYLES: Record<OSStatus, string> = {
    [OSStatus.ABERTA]: 'bg-blue-100 text-blue-700 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    [OSStatus.AGUARDANDO]: 'bg-orange-100 text-orange-700 border-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
    [OSStatus.EM_ANDAMENTO]: 'bg-purple-100 text-purple-700 border-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    [OSStatus.CONCLUIDA]: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    [OSStatus.CANCELADA]: 'bg-red-100 text-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
};

export const OSModal: React.FC<OSModalProps> = ({ isOpen, onClose, order, onSave, expenses, onAddExpense, onDeleteExpense, currentUser, suppliers = [], onAddSupplier, isMobile = false }) => {
  const [formData, setFormData] = useState<Partial<ServiceOrder>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'finance'>('details');
  
  // Chat State
  const [newLog, setNewLog] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delegation State
  const [isDelegating, setIsDelegating] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState<string>('');

  // Finance State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [newExpenseData, setNewExpenseData] = useState<Partial<Expense>>({
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.PIX,
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Supplier Dropdown State
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
              setIsSupplierDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (order) {
            setFormData({ ...order });
        } else {
            setFormData({
                id: `OS-${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: OSStatus.ABERTA,
                priority: OSPriority.MEDIA,
                unit: Unit.ALDEOTA,
                type: OSType.CORRETIVA,
                dateOpened: new Date().toISOString(),
                ownerId: currentUser.id, // Defaults to current user
                history: [],
                title: '',
                description: ''
            });
        }
        setNewLog('');
        setActiveTab('details');
        setIsDelegating(false);
        setIsAddingExpense(false);
        setExpenseToDelete(null);
        setNewExpenseData({ 
            category: ExpenseCategory.PECAS, 
            paymentMethod: PaymentMethod.PIX, 
            warrantyPartsMonths: 0, 
            warrantyServiceMonths: 0,
            date: new Date().toISOString().split('T')[0]
        });
    }
  }, [isOpen, order, currentUser]);

  useEffect(() => {
      if (activeTab === 'history' && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [formData.history, activeTab]);

  if (!isOpen) return null;

  const linkedExpenses = expenses.filter(e => e.linkedOSId === formData.id);
  const totalCost = linkedExpenses.reduce((acc, cur) => acc + cur.value, 0);
  const owner = USERS.find(u => u.id === formData.ownerId);
  const isEditing = !!order; 
  const isClosedStatus = formData.status === OSStatus.CONCLUIDA || formData.status === OSStatus.CANCELADA;
  
  // Read-Only if Archived OR Status Closed OR Mobile OR (Strictly if user is not owner/admin? No, user should see details but maybe not edit if not owner. Prompt says user only SEES their own, so if they see it, they own it).
  const isReadOnly = formData.archived || (isEditing && isClosedStatus) || isMobile;

  // Filter Suppliers
  const filteredSuppliersList = suppliers?.filter(s =>
    s.name.toLowerCase().includes((newExpenseData.supplier || '').toLowerCase()) ||
    s.category.toLowerCase().includes((newExpenseData.supplier || '').toLowerCase())
  ) || [];

  const handleSelectSupplier = (supplierName: string) => {
      setNewExpenseData({ ...newExpenseData, supplier: supplierName });
      setIsSupplierDropdownOpen(false);
  };

  const handleQuickAddSupplier = () => {
      if (!newExpenseData.supplier || !onAddSupplier) return;
      const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: newExpenseData.supplier,
          category: 'Geral',
          contact: ''
      };
      onAddSupplier(newSup);
      setIsSupplierDropdownOpen(false);
  };

  const handleSave = () => {
    if (isReadOnly) return;

    if (!formData.title) {
      alert("Preencha o Título da OS");
      return;
    }

    let finalDateClosed = formData.dateClosed;
    
    if (finalDateClosed && finalDateClosed.length === 10) {
        finalDateClosed = new Date(finalDateClosed + 'T12:00:00').toISOString();
    } else if (isClosedStatus && !finalDateClosed) {
        finalDateClosed = new Date().toISOString();
    } else if (!isClosedStatus) {
        finalDateClosed = undefined;
    }

    let finalDateOpened = formData.dateOpened || new Date().toISOString();
    if (finalDateOpened.length === 10) {
        finalDateOpened = new Date(finalDateOpened + 'T12:00:00').toISOString();
    }

    const savedOrder: ServiceOrder = {
      id: formData.id!,
      title: formData.title || '',
      unit: formData.unit || Unit.ALDEOTA,
      description: formData.description || '',
      status: formData.status || OSStatus.ABERTA,
      type: formData.type || OSType.CORRETIVA,
      priority: formData.priority || OSPriority.MEDIA,
      dateOpened: finalDateOpened,
      ownerId: formData.ownerId || currentUser.id,
      dateForecast: formData.dateForecast,
      dateClosed: finalDateClosed,
      history: formData.history || [],
      archived: formData.archived || false
    };

    if (!order) {
        savedOrder.history.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            message: `OS Criada`,
            userId: currentUser.id
        });
    }

    onSave(savedOrder);
    onClose();
  };

  const handleDelegate = () => {
     if(isReadOnly) return;
     if(!selectedDelegate) return;
     // Allow delegation only if Admin
     if(!currentUser.isAdmin) {
         alert("Permissão necessária para delegar ordens.");
         return;
     }

     const newOwner = USERS.find(u => u.id === selectedDelegate);
     if(!newOwner) return;

     if (order) {
         if(window.confirm(`Delegar para ${newOwner.name}?`)) {
             const log: HistoryLog = {
                 id: Date.now().toString(),
                 date: new Date().toISOString(),
                 message: `Responsabilidade transferida para ${newOwner.name}`,
                 userId: currentUser.id
             };
             setFormData(prev => ({
                 ...prev,
                 ownerId: newOwner.id,
                 history: [log, ...(prev.history || [])]
             }));
             setIsDelegating(false);
         }
     } else {
         setFormData(prev => ({ ...prev, ownerId: newOwner.id }));
         setIsDelegating(false);
     }
  };

  const handleAddLog = async () => {
    if (isReadOnly) return;
    if (!newLog.trim()) return;
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const log: HistoryLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      message: newLog,
      userId: currentUser.id
    };
    setFormData(prev => ({ ...prev, history: [...(prev.history || []), log] }));
    setNewLog('');
    setIsSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const log: HistoryLog = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              message: `📎 Arquivo anexado: ${file.name} (Simulação)`,
              userId: currentUser.id
          };
          setFormData(prev => ({ ...prev, history: [...(prev.history || []), log] }));
      }
  };

  const handleSaveExpense = () => {
      if (isReadOnly) return;
      if (!newExpenseData.item || !newExpenseData.value || !newExpenseData.supplier || !newExpenseData.date) {
          alert('Preencha campos obrigatórios (*)');
          return;
      }
      
      const dateToSave = newExpenseData.date 
        ? new Date(newExpenseData.date + 'T12:00:00').toISOString() 
        : new Date().toISOString();

      const expenseToSave: Expense = {
          id: `FIN-${Date.now().toString().slice(-4)}`,
          item: newExpenseData.item,
          value: Number(newExpenseData.value),
          supplier: newExpenseData.supplier,
          category: newExpenseData.category as ExpenseCategory,
          paymentMethod: newExpenseData.paymentMethod as PaymentMethod,
          date: dateToSave,
          warrantyPartsMonths: Number(newExpenseData.warrantyPartsMonths) || 0,
          warrantyServiceMonths: Number(newExpenseData.warrantyServiceMonths) || 0,
          linkedOSId: formData.id,
          unit: formData.unit as Unit,
      };
      onAddExpense(expenseToSave);
      setNewExpenseData({ 
          category: ExpenseCategory.PECAS, 
          paymentMethod: PaymentMethod.PIX, 
          warrantyPartsMonths: 0, 
          warrantyServiceMonths: 0,
          date: new Date().toISOString().split('T')[0]
      });
      setIsAddingExpense(false);
  };

  const getGroupedHistory = () => {
      const history = formData.history || [];
      const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const groups: { dateLabel: string, logs: HistoryLog[] }[] = [];
      
      sortedHistory.forEach(log => {
          const date = new Date(log.date);
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
          const isYesterday = date.toDateString() === yesterday.toDateString();

          let dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
          if (isToday) dateLabel = 'Hoje';
          if (isYesterday) dateLabel = 'Ontem';

          const lastGroup = groups[groups.length - 1];
          if (lastGroup && lastGroup.dateLabel === dateLabel) {
              lastGroup.logs.push(log);
          } else {
              groups.push({ dateLabel, logs: [log] });
          }
      });
      return groups;
  };

  const inputClass = `w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all placeholder-gray-400 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`;
  const numberInputClass = `${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      
      {/* Delete Expense Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[110] bg-red-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm border border-red-500 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-red-500 p-4 flex justify-center"><AlertOctagon className="w-10 h-10 text-white" /></div>
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Excluir Despesa?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Remover <strong>{expenseToDelete.item}</strong>?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setExpenseToDelete(null)} className="py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-sm">Cancelar</button>
                        <button onClick={() => { onDeleteExpense(expenseToDelete.id); setExpenseToDelete(null); }} className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm">Excluir</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Modal Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 relative overflow-hidden h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-800 shrink-0">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {order ? `Editar ${formData.id}` : 'Nova Ordem de Serviço'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 uppercase tracking-wide ${STATUS_STYLES[formData.status || OSStatus.ABERTA]}`}>
                       <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                       {formData.status || 'Nova'}
                    </span>
                    {isReadOnly && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600 flex items-center gap-1">
                            <Lock size={10} /> {isMobile ? 'Somente Leitura' : 'Arquivada'}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Owner / Delegate */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-full pl-1 pr-3 py-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white dark:ring-slate-700 ${owner?.color || 'bg-gray-400'}`}>
                        {owner?.avatarUrl ? (
                            <img src={owner.avatarUrl} alt={owner.initials} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            owner?.initials || '?'
                        )}
                      </div>
                      <div className="flex flex-col leading-none">
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Resp.</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{owner?.name.split(' ')[0] || '-'}</span>
                      </div>
                      {!isReadOnly && currentUser.isAdmin && (
                        <button 
                            onClick={() => { setIsDelegating(true); setSelectedDelegate(''); }} 
                            className="ml-1 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Trocar Responsável"
                        >
                            <ArrowRightLeft size={12}/>
                        </button>
                      )}
                </div>
                
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-700 px-6 bg-white dark:bg-slate-800 shrink-0 gap-4 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveTab('details')} className={`py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Detalhes</button>
            {order && (
                <>
                <button onClick={() => setActiveTab('history')} className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Chat <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full">{formData.history?.length || 0}</span>
                </button>
                <button onClick={() => setActiveTab('finance')} className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'finance' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Finanças <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full">{linkedExpenses.length}</span>
                </button>
                </>
            )}
        </div>

        {/* Body Content */}
        <div className={`flex-1 overflow-y-auto relative ${activeTab === 'history' ? 'bg-slate-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-800 p-6'}`}>
            
            {/* Delegation Overlay */}
            {isDelegating && !isReadOnly && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 z-40 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                         <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                         {order ? 'Delegar Responsabilidade' : 'Definir Responsável'}
                    </h4>
                    <p className="text-center text-gray-500 text-sm mb-4 max-w-xs">
                        {order 
                            ? "Transfira esta ordem para outro membro da equipe. Isso será registrado no histórico."
                            : "Selecione quem será o responsável pela execução desta nova solicitação."
                        }
                    </p>
                    <select className={inputClass + " max-w-xs mb-4"} value={selectedDelegate} onChange={(e) => setSelectedDelegate(e.target.value)}>
                        <option value="">Selecione...</option>
                        {USERS.filter(u => u.id !== formData.ownerId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={() => setIsDelegating(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                        <button onClick={handleDelegate} disabled={!selectedDelegate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Confirmar</button>
                    </div>
                </div>
            )}

            {/* TAB: DETAILS */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Information Column */}
                     <div className="space-y-5">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2 text-sm">Dados Principais</h4>
                        <div>
                            <label className={labelClass}>Título</label>
                            <input 
                                type="text" 
                                className={`${inputClass} text-base font-medium`} 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})} 
                                placeholder="Ex: Conserto do Ar Condicionado"
                                autoFocus={!isReadOnly} 
                                disabled={isReadOnly}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Unidade</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select className={`${inputClass} pl-10`} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as Unit})} disabled={isReadOnly}>
                                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <div className="relative">
                                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select className={`${inputClass} pl-10`} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as OSType})} disabled={isReadOnly}>
                                        {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Descrição Detalhada</label>
                            <textarea 
                                className={`${inputClass} h-32 resize-none leading-relaxed`} 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                placeholder="Descreva o problema e detalhes relevantes..."
                                disabled={isReadOnly}
                            />
                        </div>
                     </div>

                     {/* Status & Priority Column */}
                     <div className="space-y-5">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2 text-sm">Controle e Prazos</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Status</label>
                                <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as OSStatus})} disabled={isReadOnly}>
                                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Prioridade</label>
                                <select className={inputClass} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as OSPriority})} disabled={isReadOnly}>
                                    {Object.values(OSPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Abertura</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="date" 
                                        className={`${inputClass} pl-10`} 
                                        value={formData.dateOpened ? new Date(formData.dateOpened).toISOString().split('T')[0] : ''} 
                                        onChange={e => setFormData({...formData, dateOpened: e.target.value})}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Encerramento</label>
                                <div className="relative">
                                    <Check className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${formData.dateClosed ? 'text-emerald-500' : 'text-gray-400'}`} />
                                    <input 
                                        type="date" 
                                        className={`${inputClass} pl-10 ${formData.dateClosed ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-200' : ''}`} 
                                        value={formData.dateClosed ? new Date(formData.dateClosed).toISOString().split('T')[0] : ''} 
                                        onChange={e => setFormData({...formData, dateClosed: e.target.value})}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cost Summary (Read Only here) */}
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Custo Total Vinculado</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-white">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <DollarSign size={10} /> Gerenciado na aba Finanças
                            </div>
                        </div>
                     </div>
                </div>
            )}

            {/* TAB: HISTORY (Chat) */}
            {activeTab === 'history' && (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6" ref={scrollRef}>
                        {formData.history?.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-500 text-sm mt-10">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                Nenhuma atividade registrada.
                            </div>
                        )}
                        {getGroupedHistory().map((group, gIdx) => (
                            <div key={gIdx} className="relative">
                                <div className="sticky top-0 z-10 flex justify-center mb-4">
                                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                                        {group.dateLabel}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {group.logs.map((log) => {
                                        const isMe = log.userId === currentUser.id;
                                        const logUser = USERS.find(u => u.id === log.userId);
                                        return (
                                            <div key={log.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border-2 border-white dark:border-slate-800 ${logUser?.color || 'bg-gray-400'}`}>
                                                    {logUser?.initials || '?'}
                                                </div>
                                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                                        {log.message}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!isReadOnly && (
                        <div className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                            <div className="flex gap-2 items-end bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors">
                                    <Paperclip size={18} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                
                                <textarea 
                                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 max-h-24 py-2"
                                    placeholder="Digite uma mensagem..."
                                    rows={1}
                                    value={newLog}
                                    onChange={e => setNewLog(e.target.value)}
                                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddLog(); } }}
                                />
                                
                                <button 
                                    onClick={handleAddLog} 
                                    disabled={!newLog.trim() || isSending}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                                >
                                    <Send size={16} className={isSending ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: FINANCE */}
            {activeTab === 'finance' && (
                <div className="flex flex-col h-full relative">
                    <div className="flex-1 overflow-y-auto pb-20">
                        {linkedExpenses.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma despesa vinculada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {linkedExpenses.map(expense => (
                                    <div key={expense.id} className="bg-white dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                                        <div className="flex gap-3 items-center">
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                <DollarSign size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">{expense.item}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{expense.supplier} • {new Date(expense.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-700 dark:text-emerald-400">{expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            {!isReadOnly && currentUser.isAdmin && (
                                                <button onClick={() => setExpenseToDelete(expense)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isReadOnly && (
                        <div className={`p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 absolute bottom-0 left-0 w-full transition-transform duration-300 ${isAddingExpense ? 'translate-y-0' : 'translate-y-[calc(100%-70px)]'}`}>
                            {!isAddingExpense ? (
                                <button onClick={() => setIsAddingExpense(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
                                    <Plus size={18} /> Adicionar Despesa
                                </button>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-700 dark:text-white">Nova Despesa</h4>
                                        <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <input type="text" placeholder="Item / Serviço" className={inputClass} value={newExpenseData.item || ''} onChange={e => setNewExpenseData({...newExpenseData, item: e.target.value})} autoFocus />
                                        </div>
                                        <div className="relative col-span-2" ref={supplierDropdownRef}>
                                            <div className="relative">
                                                <input type="text" placeholder="Fornecedor / Prestador" className={inputClass} value={newExpenseData.supplier || ''} onChange={e => { setNewExpenseData({...newExpenseData, supplier: e.target.value}); setIsSupplierDropdownOpen(true); }} onFocus={() => setIsSupplierDropdownOpen(true)} />
                                                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                            {isSupplierDropdownOpen && (newExpenseData.supplier || filteredSuppliersList.length > 0) && (
                                                <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
                                                    {filteredSuppliersList.length > 0 && (
                                                        <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                                            {filteredSuppliersList.map(sup => (<li key={sup.id} className="px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer flex justify-between" onClick={() => handleSelectSupplier(sup.name)}><span>{sup.name}</span><span className="text-[10px] opacity-60">{sup.category}</span></li>))}
                                                        </ul>
                                                    )}
                                                    {newExpenseData.supplier && !filteredSuppliersList.some(s => s.name.toLowerCase() === newExpenseData.supplier?.toLowerCase()) && (
                                                        <div className="p-2 border-t dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50"><button onClick={handleQuickAddSupplier} className="w-full text-left px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Plus size={12} /> Cadastrar "{newExpenseData.supplier}"</button></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input type="number" placeholder="Valor (R$)" className={numberInputClass} value={newExpenseData.value || ''} onChange={e => setNewExpenseData({...newExpenseData, value: Number(e.target.value)})} />
                                        </div>
                                        <div>
                                            <input type="date" className={inputClass} value={newExpenseData.date} onChange={e => setNewExpenseData({...newExpenseData, date: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <button onClick={handleSaveExpense} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all">
                                        Salvar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* Footer Actions (Only for Details Tab) */}
        {activeTab === 'details' && (
            <div className="p-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 font-bold rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                    Cancelar
                </button>
                {!isReadOnly && (
                    <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95">
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                    </button>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
