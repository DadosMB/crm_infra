
import React, { useState, useEffect } from 'react';
import { Expense, ServiceOrder, User, ExpenseStatus } from '../types';
import { Download, X, Pencil, Printer, Calendar, DollarSign, Building2, UserCircle, Briefcase } from 'lucide-react';

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[]; // Should receive ONLY the selected expenses
  orders: ServiceOrder[];
  currentUser: User;
  onUpdateExpenses: (updatedExpenses: Expense[]) => void;
}

// Local Interface for Report Generation
interface ReportItem {
  id: string; // original Expense ID
  description: string;
  supplierName: string; // Beneficiary
  unit: string;
  date: string;
  value: number;
  bankDetails: string; // Free text for Pix/Bank
  obs: string;
}

export const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({
  isOpen,
  onClose,
  expenses,
  orders,
  currentUser,
  onUpdateExpenses
}) => {
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);

  // Initialize Report Data from Selected Expenses
  useEffect(() => {
    if (isOpen && expenses.length > 0) {
      const items: ReportItem[] = expenses.map(exp => {
          // Pre-fill logic 
          const os = orders.find(o => o.id === exp.linkedOSId);
          
          return {
              id: exp.id,
              description: `${exp.item} (Ref: ${exp.linkedOSId || 'N/A'})`,
              supplierName: exp.supplier,
              unit: exp.unit,
              date: exp.date, // ISO String
              value: exp.value,
              bankDetails: exp.paymentData?.pixKey || '', // Default to PIX key if exists, else empty
              obs: ''
          };
      });
      setReportItems(items);
    }
  }, [isOpen, expenses, orders]);

  if (!isOpen) return null;

  const handleItemChange = (id: string, field: keyof ReportItem, value: any) => {
      setReportItems(prev => prev.map(item => 
          item.id === id ? { ...item, [field]: value } : item
      ));
  };

  const generatePDF = () => {
      const total = reportItems.reduce((acc, curr) => acc + curr.value, 0);
      const weekNumber = Math.ceil((new Date().getDate() + 6 - new Date().getDay()) / 7);

      const printContent = `
        <html>
          <head>
            <title>Ordem de Pagamento - MenuBrands</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 1000px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .header h1 { font-size: 24px; font-weight: 800; color: #dc2626; margin: 0; }
              .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
              .meta-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; display: flex; justify-content: space-between; }
              .meta-item strong { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
              .meta-item span { font-size: 16px; font-weight: 600; color: #0f172a; }
              
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
              td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
              tr:last-child td { border-bottom: none; }
              
              .amount { font-weight: 700; color: #059669; font-size: 14px; }
              .bank-info { font-family: monospace; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; display: block; font-size: 11px; margin-top: 4px; border: 1px solid #e2e8f0; color: #334155; }
              
              .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
                <div>
                    <h1>Ordem de Pagamento Semanal</h1>
                    <p>Relatório consolidado para processamento de Pix e Transferências.</p>
                </div>
                <div style="text-align: right;">
                    <img src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png" alt="Logo" height="40" />
                </div>
            </div>

            <div class="meta-box">
                <div class="meta-item">
                    <strong>Referência</strong>
                    <span>Semana ${weekNumber} / ${new Date().getFullYear()}</span>
                </div>
                <div class="meta-item">
                    <strong>Total a Pagar</strong>
                    <span style="color: #dc2626;">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div class="meta-item">
                    <strong>Solicitante</strong>
                    <span>${currentUser.name}</span>
                </div>
                <div class="meta-item">
                    <strong>Data Emissão</strong>
                    <span>${new Date().toLocaleDateString()}</span>
                </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Beneficiário / Fornecedor</th>
                  <th style="width: 30%;">Descrição / Referência</th>
                  <th style="width: 25%;">Dados Bancários (PIX)</th>
                  <th style="width: 10%;">Data Venc.</th>
                  <th style="width: 10%; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${reportItems.map(item => `
                    <tr>
                      <td>
                        <strong style="font-size: 13px; display: block; margin-bottom: 2px;">${item.supplierName}</strong>
                        <span style="color: #64748b;">${item.unit}</span>
                      </td>
                      <td>
                        ${item.description}
                        ${item.obs ? `<br/><em style="color: #64748b; font-size: 10px;">Obs: ${item.obs}</em>` : ''}
                      </td>
                      <td>
                        ${item.bankDetails ? `<div class="bank-info">${item.bankDetails.replace(/\n/g, '<br/>')}</div>` : '<span style="color: #ef4444; font-weight: bold;">PENDENTE</span>'}
                      </td>
                      <td>${new Date(item.date).toLocaleDateString('pt-BR')}</td>
                      <td style="text-align: right;" class="amount">${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
                <div>Sistema CRM Infra MenuBrands v1.0</div>
                <div>Gerado em ${new Date().toLocaleString()}</div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if(printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
      }

      // Mark items as 'Programado' in the backend, but DO NOT save the text edits
      const updatedExpenses = expenses.map(e => ({
          ...e,
          status: ExpenseStatus.PROGRAMADO
      }));
      onUpdateExpenses(updatedExpenses);
      
      // Close modal after a short delay
      setTimeout(() => onClose(), 500);
  };

  const inputClass = "w-full bg-transparent border-b border-transparent hover:border-indigo-300 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none px-1 py-1 transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <Printer className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    Gerar Ordem de Pagamento
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Confira e edite os dados abaixo para a geração do relatório. <br/>
                    <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded font-bold">
                        Nota: Edições aqui são temporárias apenas para este PDF.
                    </span>
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <span className="text-xs font-bold text-slate-400 uppercase block">Total Selecionado</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {reportItems.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950/50 p-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 w-[20%]"><div className="flex items-center gap-1"><UserCircle size={14}/> Beneficiário</div></th>
                            <th className="px-4 py-3 w-[25%]"><div className="flex items-center gap-1"><Briefcase size={14}/> Descrição / Ref</div></th>
                            <th className="px-4 py-3 w-[25%]"><div className="flex items-center gap-1"><Building2 size={14}/> Dados Bancários (PIX / Conta)</div></th>
                            <th className="px-4 py-3 w-[15%]"><div className="flex items-center gap-1"><Calendar size={14}/> Data Venc.</div></th>
                            <th className="px-4 py-3 w-[15%] text-right"><div className="flex items-center justify-end gap-1"><DollarSign size={14}/> Valor</div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800 text-sm">
                        {reportItems.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                <td className="px-4 py-2 align-top">
                                    <input 
                                        type="text" 
                                        className={`${inputClass} font-bold text-slate-800 dark:text-slate-200 text-base`}
                                        value={item.supplierName}
                                        onChange={(e) => handleItemChange(item.id, 'supplierName', e.target.value)}
                                        placeholder="Nome do Beneficiário"
                                    />
                                    <input 
                                        type="text" 
                                        className={`${inputClass} text-xs text-slate-500`}
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                        placeholder="Unidade"
                                    />
                                </td>
                                <td className="px-4 py-2 align-top">
                                    <textarea 
                                        className={`${inputClass} resize-none h-16`}
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        placeholder="Descrição do serviço"
                                    />
                                </td>
                                <td className="px-4 py-2 align-top bg-yellow-50/50 dark:bg-yellow-900/10">
                                    <textarea 
                                        className={`${inputClass} font-mono text-xs text-slate-700 dark:text-slate-300 h-20 resize-none border-dashed border-slate-300 dark:border-slate-700`}
                                        value={item.bankDetails}
                                        onChange={(e) => handleItemChange(item.id, 'bankDetails', e.target.value)}
                                        placeholder="Ex: Banco X, Ag 0000, CC 00000-0 ou Chave PIX: ..."
                                    />
                                    {!item.bankDetails && (
                                        <div className="text-[10px] text-red-500 mt-1 font-bold flex items-center gap-1 animate-pulse">
                                            <Pencil size={10} /> Inserir dados bancários
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-2 align-top">
                                    <input 
                                        type="date" 
                                        className={inputClass}
                                        value={item.date ? new Date(item.date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-2 align-top text-right">
                                    <input 
                                        type="number" 
                                        className={`${inputClass} text-right font-bold text-emerald-600 dark:text-emerald-400 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                        value={item.value}
                                        onChange={(e) => handleItemChange(item.id, 'value', Number(e.target.value))}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={generatePDF}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
                <Printer size={18} />
                Gerar PDF para Financeiro
            </button>
        </div>

      </div>
    </div>
  );
};
