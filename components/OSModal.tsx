import React, { useState, useEffect } from 'react';
import { ServiceOrder, OSStatus, OSPriority, Unit, OSType, HistoryLog, Expense, User, ExpenseCategory, PaymentMethod } from '../types';
import { USERS } from '../constants';
import { X, Save, MessageSquare, Briefcase, Calendar, Link as LinkIcon, User as UserIcon, ArrowRightLeft, CheckCircle2, XCircle, Plus, Check, DollarSign } from 'lucide-react';

interface OSModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Partial<ServiceOrder> | null;
  onSave: (order: ServiceOrder) => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  currentUser: User;
}

const STATUS_LABELS: Record<OSStatus, string> = {
    [OSStatus.ABERTA]: 'Aberta',
    [OSStatus.AGUARDANDO]: 'Sob Análise', // Renamed from Aguardando
    [OSStatus.EM_ANDAMENTO]: 'Em Progresso', // Renamed from Em Andamento
    [OSStatus.CONCLUIDA]: 'Concluída',
    [OSStatus.CANCELADA]: 'Cancelada',
};

export const OSModal: React.FC<OSModalProps> = ({ isOpen, onClose, order, onSave, expenses, onAddExpense, currentUser }) => {
  const [formData, setFormData] = useState<Partial<ServiceOrder>>({});
  const [newLog, setNewLog] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'finance'>('details');
  
  // Delegation State
  const [isDelegating, setIsDelegating] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState<string>('');

  // New Expense State (Inside Modal)
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState<Partial<Expense>>({
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.PIX,
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (order) {
      setFormData({ ...order });
    } else {
      setFormData({
        status: OSStatus.ABERTA,
        priority: OSPriority.MEDIA,
        unit: Unit.ALDEOTA,
        type: OSType.CORRETIVA,
        dateOpened: new Date().toISOString(),
        ownerId: currentUser.id, // Defaults to current user
        history: [],
      });
    }
    setNewLog('');
    setActiveTab('details');
    setIsDelegating(false);
    setSelectedDelegate('');
    setIsAddingExpense(false);
    // Reset expense form
    setNewExpenseData({ 
        category: ExpenseCategory.PECAS, 
        paymentMethod: PaymentMethod.PIX,
        warrantyPartsMonths: 0,
        warrantyServiceMonths: 0,
        date: new Date().toISOString().split('T')[0]
    });
  }, [order, isOpen, currentUser]);

  if (!isOpen) return null;

  const linkedExpenses = expenses.filter(e => e.linkedOSId === formData.id);
  const totalCost = linkedExpenses.reduce((acc, cur) => acc + cur.value, 0);
  const owner = USERS.find(u => u.id === formData.ownerId);
  
  // Boolean to check if we are in Edit Mode
  const isEditing = !!formData.id;
  const isClosedStatus = formData.status === OSStatus.CONCLUIDA || formData.status === OSStatus.CANCELADA;

  const handleSave = () => {
    if (!formData.title) {
      alert("Preencha o Título da OS");
      return;
    }

    // Force closed date if status is closed but no date provided
    let finalDateClosed = formData.dateClosed;
    if (isClosedStatus && !finalDateClosed) {
        finalDateClosed = new Date().toISOString();
    } else if (!isClosedStatus) {
        finalDateClosed = undefined; // clear date if reopened
    }

    const savedOrder: ServiceOrder = {
      id: formData.id || `OS-${Date.now().toString().slice(-4)}`,
      title: formData.title || '',
      unit: formData.unit || Unit.ALDEOTA,
      description: formData.description || '',
      status: formData.status || OSStatus.ABERTA,
      type: formData.type || OSType.CORRETIVA,
      priority: formData.priority || OSPriority.MEDIA,
      dateOpened: formData.dateOpened || new Date().toISOString(),
      ownerId: formData.ownerId || currentUser.id,
      dateForecast: formData.dateForecast,
      dateClosed: finalDateClosed,
      history: formData.history || []
    };

    // Auto-add history if status changed or new creation
    if (!formData.id) {
        savedOrder.history.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            message: `OS Criada por ${currentUser.name}`
        });
    }
    // Simple check if status changed to add history (simplified logic)
    if (order && order.status !== savedOrder.status) {
         savedOrder.history.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            message: `Status alterado para: ${STATUS_LABELS[savedOrder.status]} (${currentUser.name})`
        });
    }

    onSave(savedOrder);
    onClose();
  };

  const handleDelegate = () => {
     if(!selectedDelegate) return;
     const newOwner = USERS.find(u => u.id === selectedDelegate);
     if(!newOwner) return;

     if(window.confirm(`Você tem certeza que deseja delegar essa Ordem para ${newOwner.name}?`)) {
         const log: HistoryLog = {
             id: Date.now().toString(),
             date: new Date().toISOString(),
             message: `Responsabilidade transferida de ${owner?.name || 'Sistema'} para ${newOwner.name} por ${currentUser.name}`
         };
         
         setFormData(prev => ({
             ...prev,
             ownerId: newOwner.id,
             history: [log, ...(prev.history || [])]
         }));
         setIsDelegating(false);
     }
  };

  const handleAddLog = () => {
    if (!newLog.trim()) return;
    const log: HistoryLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      message: `${newLog} (${currentUser.name})`
    };
    setFormData(prev => ({
      ...prev,
      history: [log, ...(prev.history || [])]
    }));
    setNewLog('');
  };

  const handleSaveExpense = () => {
      // Validation: Check ALL required fields
      if (!newExpenseData.item || !newExpenseData.value || !newExpenseData.supplier || !newExpenseData.date) {
          alert('Por favor, preencha todos os campos obrigatórios: Item, Valor, Fornecedor e Data.');
          return;
      }

      const expenseToSave: Expense = {
          id: `FIN-${Date.now().toString().slice(-4)}`,
          item: newExpenseData.item,
          value: Number(newExpenseData.value),
          supplier: newExpenseData.supplier,
          category: newExpenseData.category as ExpenseCategory,
          paymentMethod: newExpenseData.paymentMethod as PaymentMethod || PaymentMethod.PIX,
          date: newExpenseData.date, // Use selected date
          warrantyPartsMonths: Number(newExpenseData.warrantyPartsMonths) || 0,
          warrantyServiceMonths: Number(newExpenseData.warrantyServiceMonths) || 0,
          linkedOSId: formData.id, // Link to current OS
          unit: formData.unit as Unit, // Inherit unit from OS for consistency
      };

      onAddExpense(expenseToSave);
      
      // Reset
      setNewExpenseData({ 
          category: ExpenseCategory.PECAS, 
          paymentMethod: PaymentMethod.PIX,
          warrantyPartsMonths: 0,
          warrantyServiceMonths: 0,
          date: new Date().toISOString().split('T')[0]
      });
      setIsAddingExpense(false);
  };

  const inputClass = "w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 mt-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-slate-400";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              {isEditing ? `Editar ${formData.id}` : 'Nova Ordem de Serviço'}
            </h3>
            {isEditing && <span className="text-xs text-gray-500 dark:text-gray-400">Aberta em: {new Date(formData.dateOpened!).toLocaleDateString('pt-BR')}</span>}
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
                <div className="flex items-center gap-2 mr-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-full shadow-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${owner?.color}`}>
                        {owner?.initials}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        <span className="block font-bold">{owner?.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Responsável</span>
                    </div>
                    <button 
                        onClick={() => {
                            setIsDelegating(true);
                            setSelectedDelegate(owner?.id !== currentUser.id ? currentUser.id : '');
                        }}
                        className="ml-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 p-1 rounded transition-colors"
                        title="Delegar OS"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-700 px-6">
            <button onClick={() => setActiveTab('details')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Detalhes</button>
            
            {/* Show History only if Editing */}
            {isEditing && (
              <button onClick={() => setActiveTab('history')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Histórico & Chat</button>
            )}

            {isEditing && (
                <button onClick={() => setActiveTab('finance')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finance' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Finanças ({linkedExpenses.length})</button>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 relative">
          
          {/* Delegation Modal Overlay */}
          {isDelegating && (
             <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 z-10 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                 <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                     <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                     Delegar Responsabilidade
                 </h4>
                 <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-sm">
                     Selecione o novo responsável por esta Ordem de Serviço. A ação será registrada no histórico.
                 </p>
                 <div className="w-full max-w-xs space-y-3">
                     <select 
                        className={inputClass}
                        value={selectedDelegate}
                        onChange={(e) => setSelectedDelegate(e.target.value)}
                     >
                         <option value="">Selecione um usuário...</option>
                         {USERS.filter(u => u.id !== formData.ownerId).map(u => (
                             <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                         ))}
                     </select>
                     <div className="flex gap-2">
                        <button 
                            onClick={() => setIsDelegating(false)} 
                            className="flex-1 py-2 border dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleDelegate}
                            disabled={!selectedDelegate}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmar
                        </button>
                     </div>
                 </div>
             </div>
          )}

          {activeTab === 'details' && (
             <div className="space-y-4">
               {/* 1. Título */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                 <input 
                  type="text" 
                  className={inputClass}
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Resumo curto da solicitação (ex: Ar condicionado vazando)" 
                  autoFocus
                 />
               </div>

               {/* 2. Seletores em Grid */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade</label>
                   <select className={inputClass} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as Unit})}>
                     {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Manutenção</label>
                   <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as OSType})}>
                     {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade</label>
                   <select className={inputClass} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as OSPriority})}>
                     {Object.values(OSPriority).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Atual</label>
                   <select 
                    className={`${inputClass} font-semibold ${
                        formData.status === OSStatus.CONCLUIDA ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        formData.status === OSStatus.CANCELADA ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 
                        'text-indigo-700 dark:text-indigo-400'
                    }`} 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as OSStatus})}
                   >
                     {/* Custom Order as requested */}
                     <option value={OSStatus.ABERTA}>{STATUS_LABELS[OSStatus.ABERTA]}</option>
                     <option value={OSStatus.AGUARDANDO}>{STATUS_LABELS[OSStatus.AGUARDANDO]}</option>
                     <option value={OSStatus.EM_ANDAMENTO}>{STATUS_LABELS[OSStatus.EM_ANDAMENTO]}</option>
                     <option disabled>──────────</option>
                     <option value={OSStatus.CONCLUIDA}>{STATUS_LABELS[OSStatus.CONCLUIDA]}</option>
                     <option value={OSStatus.CANCELADA}>{STATUS_LABELS[OSStatus.CANCELADA]}</option>
                   </select>
                 </div>
                 
                 {/* Conditional Date Field for Closed/Cancelled */}
                 {isClosedStatus ? (
                    <div className="col-span-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            Data de Fechamento ({formData.status === OSStatus.CONCLUIDA ? 'Conclusão' : 'Cancelamento'})
                        </label>
                        <input 
                            type="date" 
                            className={inputClass} 
                            value={formData.dateClosed ? new Date(formData.dateClosed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                            onChange={e => setFormData({...formData, dateClosed: e.target.value})} 
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Necessário para cálculo de prazo médio.
                        </p>
                    </div>
                 ) : (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Previsão (Opcional)</label>
                        <input 
                            type="date" 
                            className={inputClass} 
                            value={formData.dateForecast ? new Date(formData.dateForecast).toISOString().split('T')[0] : ''} 
                            onChange={e => setFormData({...formData, dateForecast: e.target.value})} 
                        />
                     </div>
                 )}
               </div>

               {/* 3. Descrição Detalhada */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Detalhada</label>
                 <textarea 
                  rows={6} 
                  className={inputClass} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Descreva o que está acontecendo, observações técnicas, localização exata do problema, etc."
                 />
               </div>
             </div>
          )}

          {activeTab === 'history' && isEditing && (
             <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4 min-h-[200px]">
                    {formData.history?.map(log => (
                        <div key={log.id} className="flex flex-col bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">{new Date(log.date).toLocaleString('pt-BR')}</div>
                            <div className="text-gray-800 dark:text-gray-200 text-sm">{log.message}</div>
                        </div>
                    ))}
                    {(!formData.history || formData.history.length === 0) && <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-10">Nenhum histórico registrado.</p>}
                </div>
                <div className="mt-auto flex gap-2 pt-4 border-t dark:border-slate-700">
                    <input 
                        type="text" 
                        className={inputClass + " mt-0"}
                        placeholder="Adicionar atualização..." 
                        value={newLog}
                        onChange={e => setNewLog(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddLog()}
                    />
                    <button onClick={handleAddLog} className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-700 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
             </div>
          )}

          {activeTab === 'finance' && isEditing && (
              <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg flex justify-between items-center">
                      <span className="text-emerald-800 dark:text-emerald-200 font-medium">Custo Total Vinculado</span>
                      <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>

                  {/* Add Expense Section */}
                  {!isAddingExpense ? (
                      <button 
                          onClick={() => {
                              setIsAddingExpense(true);
                              // Ensure date is set to today and unit matches OS when opening form
                              setNewExpenseData(prev => ({
                                  ...prev,
                                  date: new Date().toISOString().split('T')[0],
                                  unit: formData.unit
                              }));
                          }}
                          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 dark:text-gray-400 font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2"
                      >
                          <Plus size={16} /> Adicionar Novo Gasto
                      </button>
                  ) : (
                      <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600 animate-in fade-in slide-in-from-top-2">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3 border-b dark:border-slate-600 pb-2 flex items-center gap-2">
                              <DollarSign size={14} className="text-emerald-600" />
                              Novo Registro Financeiro
                          </h4>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                              {/* Row 1 */}
                              <div className="col-span-2 lg:col-span-3">
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Item / Descrição <span className="text-red-500">*</span></label>
                                  <input 
                                      type="text" 
                                      className={inputClass} 
                                      placeholder="Ex: Torneira, Reparo, etc."
                                      value={newExpenseData.item || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, item: e.target.value})}
                                  />
                              </div>

                              {/* Row 2 */}
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Valor (R$) <span className="text-red-500">*</span></label>
                                  <input 
                                      type="number" 
                                      className={inputClass}
                                      placeholder="0,00"
                                      value={newExpenseData.value || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, value: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Data da Despesa <span className="text-red-500">*</span></label>
                                   <input 
                                      type="date" 
                                      className={inputClass} 
                                      value={newExpenseData.date || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, date: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Categoria <span className="text-red-500">*</span></label>
                                  <select 
                                      className={inputClass}
                                      value={newExpenseData.category}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, category: e.target.value as ExpenseCategory})}
                                  >
                                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>

                              {/* Row 3 */}
                              <div className="col-span-2">
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Fornecedor <span className="text-red-500">*</span></label>
                                  <input 
                                      type="text" 
                                      className={inputClass}
                                      placeholder="Nome do fornecedor"
                                      value={newExpenseData.supplier || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, supplier: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Pagamento <span className="text-red-500">*</span></label>
                                  <select 
                                      className={inputClass}
                                      value={newExpenseData.paymentMethod}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, paymentMethod: e.target.value as PaymentMethod})}
                                  >
                                      {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                              </div>

                              {/* Row 4 - Warranties */}
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Garantia Peças (Meses)</label>
                                  <input 
                                      type="number" 
                                      className={inputClass}
                                      placeholder="0"
                                      value={newExpenseData.warrantyPartsMonths || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, warrantyPartsMonths: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Garantia Serviço (Meses)</label>
                                  <input 
                                      type="number" 
                                      className={inputClass}
                                      placeholder="0"
                                      value={newExpenseData.warrantyServiceMonths || ''}
                                      onChange={(e) => setNewExpenseData({...newExpenseData, warrantyServiceMonths: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">Unidade (Vinculada à OS)</label>
                                  <input 
                                      type="text" 
                                      className={`${inputClass} bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                                      value={formData.unit}
                                      readOnly
                                  />
                              </div>

                          </div>
                          
                          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-slate-600 mt-2">
                              <button 
                                  onClick={() => setIsAddingExpense(false)}
                                  className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md"
                              >
                                  Cancelar
                              </button>
                              <button 
                                  onClick={handleSaveExpense}
                                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md shadow-sm flex items-center gap-1"
                              >
                                  <Check size={14} /> Salvar Gasto
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="border dark:border-slate-600 rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase text-gray-600 dark:text-gray-300">
                              <tr>
                                  <th className="px-4 py-2">Data</th>
                                  <th className="px-4 py-2">Item</th>
                                  <th className="px-4 py-2">Valor</th>
                              </tr>
                          </thead>
                          <tbody>
                              {linkedExpenses.map(e => (
                                  <tr key={e.id} className="border-t dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                                      <td className="px-4 py-2">
                                          <div className="font-medium text-gray-800 dark:text-gray-200">{e.item}</div>
                                          <div className="text-[10px] text-gray-500 dark:text-gray-400 flex gap-2">
                                              <span>{e.supplier}</span>
                                              <span className="text-gray-300 dark:text-gray-600">|</span>
                                              <span>{e.category}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 py-2 font-bold text-emerald-600 dark:text-emerald-400">{e.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                  </tr>
                              ))}
                              {linkedExpenses.length === 0 && (
                                  <tr>
                                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Nenhum gasto vinculado a esta OS.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
            <Save className="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};