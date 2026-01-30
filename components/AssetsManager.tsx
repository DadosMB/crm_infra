
import React, { useState, useMemo } from 'react';
import { Asset, AssetStatus, AssetCategory, Unit, User } from '../types';
import { Search, Plus, Filter, Package, QrCode, ShieldCheck, ShieldAlert, Monitor, CheckCircle2, Box, PenTool } from 'lucide-react';
import { SortableHeader } from './SortableHeader';
import { getWarrantyStatus } from '../utils';

interface AssetsManagerProps {
  assets: Asset[];
  onAddAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  currentUser: User;
  isMobile?: boolean;
}

export const AssetsManager: React.FC<AssetsManagerProps> = ({ 
    assets, 
    onAddAsset, 
    onEditAsset, 
    currentUser,
    isMobile = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'ALL'>('ALL');
  const [unitFilter, setUnitFilter] = useState<Unit | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Stats
  const totalValue = assets.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const activeAssets = assets.filter(a => a.status === AssetStatus.ATIVO).length;

  const filteredAssets = useMemo(() => {
      return assets.filter(a => {
          const matchSearch = 
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            a.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.brand?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
          const matchCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
          const matchUnit = unitFilter === 'ALL' || a.unit === unitFilter;

          return matchSearch && matchStatus && matchCategory && matchUnit;
      });
  }, [assets, searchTerm, statusFilter, categoryFilter, unitFilter]);

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
                <button 
                    onClick={onAddAsset}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all text-sm font-bold active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Novo Bem
                </button>
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
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm md:col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Patrimonial Total</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            
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
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <select 
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value as Unit | 'ALL')}
                    >
                        <option value="ALL">Todas Unidades</option>
                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select 
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | 'ALL')}
                    >
                        <option value="ALL">Todas Categorias</option>
                        {Object.values(AssetCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'ALL')}
                    >
                        <option value="ALL">Todos Status</option>
                        {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                            <SortableHeader label="Patrimônio" sortKey="assetTag" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-32" />
                            <SortableHeader label="Bem" sortKey="name" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                            <SortableHeader label="Categoria" sortKey="category" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                            <SortableHeader label="Unidade" sortKey="unit" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                            <SortableHeader label="Status" sortKey="status" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                            <SortableHeader label="Garantia" sortKey="warranty" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                            <SortableHeader label="Valor" sortKey="value" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="right" />
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
                                <td className="px-4 py-4">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-600">
                                        {asset.category}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{asset.unit}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${getStatusColor(asset.status)}`}>
                                        {asset.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <WarrantyBadge asset={asset} />
                                </td>
                                <td className="px-4 py-4 text-right">
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
    </div>
  );
};
