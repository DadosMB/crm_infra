
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Asset, AssetStatus, AssetCategory, Unit, User, MaintenanceRecord } from '../types';
import { Search, Plus, Filter, Package, QrCode, ShieldCheck, ShieldAlert, Monitor, CheckCircle2, Box, PenTool, ArrowRightLeft, Truck, Wrench, Calendar, Phone, Check, ChevronDown, X, Download, UploadCloud } from 'lucide-react';
import { SortableHeader } from './SortableHeader';
import { getWarrantyStatus } from '../utils';
import { AssetExportModal } from './AssetExportModal';
import { AssetImportModal } from './AssetImportModal';

interface AssetsManagerProps {
  assets: Asset[];
  maintenanceRecords: MaintenanceRecord[];
  onAddAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onTransferClick: () => void;
  onMaintenanceClick: () => void;
  onReturnAsset: (recordId: string) => void;
  onImportAssets: (newAssets: Asset[]) => void; // New prop
  currentUser: User;
  isMobile?: boolean;
  categories: string[]; 
}

// Reusable Multi-Select Dropdown Component
const MultiSelectFilter = ({ 
    label, 
    options, 
    selected, 
    onChange, 
    onClear,
    alignRight = false
}: { 
    label: string; 
    options: string[]; 
    selected: string[]; 
    onChange: (value: string) => void; 
    onClear: () => void;
    alignRight?: boolean;
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all shadow-sm ${selected.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
            >
                {selected.length === 0 ? (
                    <span className="opacity-80">Todas {label}</span>
                ) : (
                    <span className="font-bold">{selected.length === 1 ? selected[0] : `${selected.length} ${label}`}</span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
            </button>

            {isOpen && (
                <div className={`absolute top-full mt-2 w-60 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${alignRight ? 'right-0' : 'left-0'}`}>
                    <div className="p-2 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Filtrar por {label}</span>
                        {selected.length > 0 && (
                            <button onClick={() => { onClear(); setIsOpen(false); }} className="text-xs text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                Limpar
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar space-y-0.5">
                        {options.map(option => {
                            const isSelected = selected.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => onChange(option)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    <span className="truncate">{option}</span>
                                    {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AssetsManager: React.FC<AssetsManagerProps> = ({ 
    assets, 
    maintenanceRecords,
    onAddAsset, 
    onEditAsset, 
    onTransferClick,
    onMaintenanceClick,
    onReturnAsset,
    onImportAssets,
    currentUser,
    isMobile = false,
    categories
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'maintenance'>('inventory');
  
  // Inventory State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Multi-select filters state
  const [selectedStatuses, setSelectedStatuses] = useState<AssetStatus[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Changed to string
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Modals State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Helper to toggle selection
  const toggleSelection = <T extends string>(item: T, list: T[], setList: (l: T[]) => void) => {
      if (list.includes(item)) {
          setList(list.filter(i => i !== item));
      } else {
          setList([...list, item]);
      }
  };

  // Stats
  const totalValue = assets.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const activeAssets = assets.filter(a => a.status === AssetStatus.ATIVO).length;
  const maintenanceAssets = assets.filter(a => a.status === AssetStatus.EM_MANUTENCAO).length;

  // -- INVENTORY LOGIC --
  const filteredAssets = useMemo(() => {
      return assets.filter(a => {
          const matchSearch = 
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.brand?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(a.status);
          // Cast a.category to string to match prop type
          const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(a.category as string);
          const matchUnit = selectedUnits.length === 0 || selectedUnits.includes(a.unit);

          return matchSearch && matchStatus && matchCategory && matchUnit;
      });
  }, [assets, searchTerm, selectedStatuses, selectedCategories, selectedUnits]);

  const sortedAssets = useMemo(() => {
      if (!sortConfig) return filteredAssets;
      
      return [...filteredAssets].sort((a, b) => {
          let valA: any = a[sortConfig.key as keyof Asset];
          let valB: any = b[sortConfig.key as keyof Asset];

          if (sortConfig.key === 'warranty') {
             valA = getWarrantyStatus(a.warranty);
             valB = getWarrantyStatus(b.warranty);
          }

          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [filteredAssets, sortConfig]);

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  // -- MAINTENANCE LOGIC --
  const activeMaintenanceRecords = useMemo(() => {
      return maintenanceRecords.filter(r => r.active).map(record => {
          const asset = assets.find(a => a.id === record.assetId);
          return { ...record, asset };
      });
  }, [maintenanceRecords, assets]);


  // -- HELPERS --
  const getStatusColor = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.ATIVO: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
          case AssetStatus.EM_MANUTENCAO: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
          case AssetStatus.BAIXADO: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
          case AssetStatus.INATIVO: return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400 border-slate-200 dark:border-slate-600';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  const WarrantyBadge = ({ asset }: { asset: Asset }) => {
      const status = getWarrantyStatus(asset.warranty);
      if (status === 'none') return <span className="text-slate-400 text-xs">-</span>;
      
      if (status === 'active') {
          return (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800" title={`Ativa até ${new Date(asset.warranty.endDate!).toLocaleDateString()}`}>
                  <ShieldCheck size={12} /> Ativa
              </span>
          );
      }
      return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800" title={`Venceu em ${new Date(asset.warranty.endDate!).toLocaleDateString()}`}>
              <ShieldAlert size={12} /> Vencida
          </span>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Patrimônio / Bens
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestão simplificada de ativos e equipamentos.</p>
            </div>
            {!isMobile && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                        title="Importar CSV"
                    >
                        <UploadCloud className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                        title="Exportar Relatório"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onTransferClick}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transferir
                    </button>
                    <button 
                        onClick={onAddAsset}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Bem
                    </button>
                </div>
            )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Total de Itens</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{assets.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Itens Ativos</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeAssets}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Em Manutenção</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{maintenanceAssets}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Box size={16} /> Inventário
            </button>
            <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'maintenance' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Truck size={16} /> Controle de Saída
                {activeMaintenanceRecords.length > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full">{activeMaintenanceRecords.length}</span>}
            </button>
        </div>

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2">
                
                {/* Toolbar */}
                <div className="p-4 border-b dark:border-slate-700 flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, etiqueta ou marca..." 
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <MultiSelectFilter 
                            label="Unidades"
                            options={Object.values(Unit)}
                            selected={selectedUnits}
                            onChange={(val) => toggleSelection(val as Unit, selectedUnits, setSelectedUnits)}
                            onClear={() => setSelectedUnits([])}
                        />
                        <MultiSelectFilter 
                            label="Categorias"
                            options={categories}
                            selected={selectedCategories}
                            onChange={(val) => toggleSelection(val, selectedCategories, setSelectedCategories)}
                            onClear={() => setSelectedCategories([])}
                        />
                        <MultiSelectFilter 
                            label="Status"
                            options={Object.values(AssetStatus)}
                            selected={selectedStatuses}
                            onChange={(val) => toggleSelection(val as AssetStatus, selectedStatuses, setSelectedStatuses)}
                            onClear={() => setSelectedStatuses([])}
                            alignRight
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <SortableHeader label="Patrimônio" sortKey="assetTag" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-32" />
                                <SortableHeader label="Bem" sortKey="name" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Categoria" sortKey="category" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-48" />
                                <SortableHeader label="Unidade" sortKey="unit" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-40" />
                                <SortableHeader label="Status" sortKey="status" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-32" />
                                <SortableHeader label="Garantia" sortKey="warranty" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-32" />
                                <SortableHeader label="Valor" sortKey="value" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="right" width="w-32" />
                                <th className="px-6 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {sortedAssets.map(asset => (
                                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => onEditAsset(asset)}>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                                            <QrCode size={12} /> {asset.assetTag}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
                                                {asset.photoUrl ? (
                                                    <img src={asset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{asset.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{asset.brand} {asset.model}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                            {asset.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{asset.unit}</span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border whitespace-nowrap ${getStatusColor(asset.status)}`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <WarrantyBadge asset={asset} />
                                    </td>
                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {asset.value ? asset.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditAsset(asset); }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <PenTool size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sortedAssets.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search size={24} className="opacity-20" />
                                            <span>Nenhum ativo encontrado.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="px-4 py-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Mostrando {sortedAssets.length} registros</span>
                    {isMobile && <span className="italic">Visualização simplificada mobile</span>}
                </div>
            </div>
        )}

        {/* --- MAINTENANCE TAB --- */}
        {activeTab === 'maintenance' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2">
                
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400">
                            <Wrench size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Equipamentos em Conserto Externo</h3>
                            <p className="text-xs text-amber-700 dark:text-amber-300 opacity-80">Itens atualmente fora da empresa.</p>
                        </div>
                    </div>
                    {!isMobile && (
                        <button 
                            onClick={onMaintenanceClick}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                        >
                            <Truck className="w-4 h-4" />
                            Registrar Saída
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bem Patrimonial</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsável / Prestador</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saída / Previsão</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                                <th className="px-6 py-3 w-10">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {activeMaintenanceRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        {record.asset ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{record.asset.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{record.asset.assetTag}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-red-500 text-xs">Bem não encontrado</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{record.providerName}</div>
                                        {record.contactInfo && (
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Phone size={10} /> {record.contactInfo}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                <Truck size={10} className="text-amber-500" /> Saiu: {new Date(record.dateOut).toLocaleDateString('pt-BR')}
                                            </span>
                                            {record.dateReturnForecast && (
                                                <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10} /> Prev: {new Date(record.dateReturnForecast).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs line-clamp-2">{record.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => {
                                                if(confirm(`Confirmar o retorno do bem ${record.asset?.name}?`)) {
                                                    onReturnAsset(record.id);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <CheckCircle2 size={12} /> Registrar Retorno
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {activeMaintenanceRecords.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Check size={24} className="opacity-20" />
                                            <span>Nenhum equipamento em manutenção externa no momento.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <AssetExportModal 
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            assets={assets}
            categories={categories}
        />

        <AssetImportModal 
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={onImportAssets}
        />
    </div>
  );
};
