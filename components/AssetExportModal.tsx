
import React, { useState, useMemo } from 'react';
import { Asset, Unit, AssetStatus, AssetCategory } from '../types';
import { X, FileSpreadsheet, FileText, Calendar, Filter, Check, Download } from 'lucide-react';

interface AssetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  categories: string[];
}

interface CustomCheckboxProps {
    checked: boolean;
    onChange: () => void;
    label: string;
}

// Custom Checkbox Component to guarantee visual consistency
const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label }) => (
<div 
    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group select-none"
    onClick={onChange}
>
    <div 
        className={`
            w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
            ${checked 
                ? 'bg-indigo-600 border-indigo-600' 
                : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 group-hover:border-indigo-400'}
        `}
    >
        {checked && <Check size={10} className="text-white" strokeWidth={4} />}
    </div>
    <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{label}</span>
</div>
);

export const AssetExportModal: React.FC<AssetExportModalProps> = ({ isOpen, onClose, assets, categories }) => {
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Reset functionality
  React.useEffect(() => {
    if (isOpen) {
        setStartDate('');
        setEndDate('');
        setSelectedUnits([]);
        setSelectedStatuses([]);
        setSelectedCategories([]);
    }
  }, [isOpen]);

  // Filter Logic
  const filteredData = useMemo(() => {
      return assets.filter(asset => {
          // Date Filter (Registration Date)
          if (startDate || endDate) {
              const regDate = new Date(asset.registrationDate).getTime();
              if (startDate && regDate < new Date(startDate).getTime()) return false;
              // End date inclusive (end of day)
              if (endDate) {
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  if (regDate > end.getTime()) return false;
              }
          }

          // Unit Filter
          if (selectedUnits.length > 0 && !selectedUnits.includes(asset.unit)) return false;

          // Status Filter
          if (selectedStatuses.length > 0 && !selectedStatuses.includes(asset.status)) return false;

          // Category Filter
          if (selectedCategories.length > 0 && !selectedCategories.includes(asset.category)) return false;

          return true;
      });
  }, [assets, startDate, endDate, selectedUnits, selectedStatuses, selectedCategories]);

  // Selection Helpers
  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
      if (list.includes(item)) setList(list.filter(i => i !== item));
      else setList([...list, item]);
  };

  const selectAll = (all: string[], setList: (l: string[]) => void) => setList(all);
  const clearAll = (setList: (l: string[]) => void) => setList([]);

  // CSV Export
  const handleExportCSV = () => {
      const headers = ['Patrimonio', 'Bem', 'Categoria', 'Marca', 'Modelo', 'Unidade', 'Status', 'Valor', 'Data Aquisicao'];
      const rows = filteredData.map(a => [
          a.assetTag,
          `"${a.name.replace(/"/g, '""')}"`,
          a.category,
          a.brand || '',
          a.model || '',
          a.unit,
          a.status,
          (a.value || 0).toFixed(2),
          new Date(a.registrationDate).toLocaleDateString('pt-BR')
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + 
          [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `patrimonio_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
  };

  // PDF Export
  const handleExportPDF = () => {
      const totalValue = filteredData.reduce((acc, curr) => acc + (curr.value || 0), 0);
      
      const printContent = `
        <html>
          <head>
            <title>Relatório de Patrimônio</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 1000px; margin: 0 auto; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
              h1 { margin: 0; color: #0f172a; font-size: 24px; }
              p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
              
              .summary { display: flex; gap: 20px; margin-bottom: 30px; }
              .card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; flex: 1; }
              .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 5px; }
              .card-value { font-size: 18px; font-weight: 700; color: #0f172a; }
              
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              tr:last-child td { border-bottom: none; }
              
              .tag { font-family: monospace; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; }
              .val { font-weight: 700; text-align: right; }
              .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
                <div>
                    <h1>Relatório de Bens Patrimoniais</h1>
                    <p>Listagem gerada em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
                </div>
                <img src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png" height="40" alt="Logo" />
            </div>

            <div class="summary">
                <div class="card">
                    <span class="card-label">Total de Itens</span>
                    <span class="card-value">${filteredData.length}</span>
                </div>
                <div class="card">
                    <span class="card-label">Valor Total Estimado</span>
                    <span class="card-value" style="color: #059669;">${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div class="card">
                    <span class="card-label">Filtros</span>
                    <span class="card-value" style="font-size: 12px; font-weight: 400;">
                        ${selectedUnits.length > 0 ? selectedUnits.length + ' Unidades, ' : 'Todas Unidades, '}
                        ${selectedCategories.length > 0 ? selectedCategories.length + ' Categorias' : 'Todas Categorias'}
                    </span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="15%">Patrimônio</th>
                        <th width="30%">Descrição do Bem</th>
                        <th width="15%">Categoria</th>
                        <th width="15%">Unidade</th>
                        <th width="10%">Status</th>
                        <th width="15%" style="text-align: right;">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(item => `
                        <tr>
                            <td><span class="tag">${item.assetTag}</span></td>
                            <td>
                                <strong>${item.name}</strong><br/>
                                <span style="color:#64748b;">${item.brand} ${item.model || ''}</span>
                            </td>
                            <td>${item.category}</td>
                            <td>${item.unit}</td>
                            <td>${item.status}</td>
                            <td class="val">${(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                CRM Infra MenuBrands v1.0 • Documento Interno
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
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-700">
        
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Exportar Relatório
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Selecione os filtros para gerar o documento.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Date Filter */}
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Calendar size={16} /> Data de Cadastro (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">De:</label>
                        <input type="date" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Até:</label>
                        <input type="date" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Checkbox Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Unit Filter */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Unidades</h4>
                        <div className="flex gap-2">
                            <button onClick={() => selectAll(Object.values(Unit), setSelectedUnits)} className="text-[10px] text-indigo-500 font-bold hover:underline">Todos</button>
                            <button onClick={() => clearAll(setSelectedUnits)} className="text-[10px] text-slate-400 font-bold hover:underline">Limpar</button>
                        </div>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {Object.values(Unit).map(u => (
                            <CustomCheckbox 
                                key={u}
                                label={u}
                                checked={selectedUnits.includes(u)}
                                onChange={() => toggleSelection(u, selectedUnits, setSelectedUnits)}
                            />
                        ))}
                    </div>
                </div>

                {/* Status Filter */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Status</h4>
                        <div className="flex gap-2">
                            <button onClick={() => selectAll(Object.values(AssetStatus), setSelectedStatuses)} className="text-[10px] text-indigo-500 font-bold hover:underline">Todos</button>
                            <button onClick={() => clearAll(setSelectedStatuses)} className="text-[10px] text-slate-400 font-bold hover:underline">Limpar</button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {Object.values(AssetStatus).map(s => (
                            <CustomCheckbox 
                                key={s}
                                label={s}
                                checked={selectedStatuses.includes(s)}
                                onChange={() => toggleSelection(s, selectedStatuses, setSelectedStatuses)}
                            />
                        ))}
                    </div>
                </div>

                {/* Category Filter - Full Width */}
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Categorias</h4>
                        <div className="flex gap-2">
                            <button onClick={() => selectAll(categories, setSelectedCategories)} className="text-[10px] text-indigo-500 font-bold hover:underline">Todos</button>
                            <button onClick={() => clearAll(setSelectedCategories)} className="text-[10px] text-slate-400 font-bold hover:underline">Limpar</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {categories.map(cat => (
                            <CustomCheckbox 
                                key={cat}
                                label={cat}
                                checked={selectedCategories.includes(cat)}
                                onChange={() => toggleSelection(cat, selectedCategories, setSelectedCategories)}
                            />
                        ))}
                    </div>
                </div>

            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex items-center justify-between border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Filter size={18} />
                    <span className="text-sm font-bold">Itens encontrados:</span>
                </div>
                <span className="text-xl font-bold text-indigo-800 dark:text-white">{filteredData.length}</span>
            </div>

        </div>

        <div className="p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                Cancelar
            </button>
            <button 
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
                CSV
            </button>
            <button 
                onClick={handleExportPDF}
                disabled={filteredData.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileText size={18} />
                PDF
            </button>
        </div>

      </div>
    </div>
  );
};
