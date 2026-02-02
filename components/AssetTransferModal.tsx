
import React, { useState, useMemo } from 'react';
import { Asset, Unit } from '../types';
import { X, ArrowRightLeft, MapPin, Search, Box, ArrowRight } from 'lucide-react';

interface AssetTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onTransfer: (assetId: string, targetUnit: Unit) => void;
}

export const AssetTransferModal: React.FC<AssetTransferModalProps> = ({ isOpen, onClose, assets, onTransfer }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<Unit | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAssetId('');
      setTargetUnit('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId), 
  [assets, selectedAssetId]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const lower = searchTerm.toLowerCase();
    return assets.filter(a => 
      a.name.toLowerCase().includes(lower) || 
      a.assetTag.toLowerCase().includes(lower)
    );
  }, [assets, searchTerm]);

  const handleConfirm = () => {
    if (selectedAssetId && targetUnit) {
      onTransfer(selectedAssetId, targetUnit);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Transferência de Patrimônio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mover equipamento entre unidades.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* 1. Select Asset */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Selecione o Bem</label>
                {!selectedAsset ? (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 pl-10 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400"
                            placeholder="Buscar por nome ou etiqueta..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <div className="absolute top-full left-0 w-full mt-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl z-20">
                                {filteredAssets.length > 0 ? (
                                    filteredAssets.map(asset => (
                                        <button 
                                            key={asset.id}
                                            onClick={() => { setSelectedAssetId(asset.id); setSearchTerm(''); }}
                                            className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-slate-600 border-b border-gray-50 dark:border-slate-600 last:border-0 flex justify-between items-center group transition-colors"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{asset.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{asset.assetTag}</div>
                                            </div>
                                            <div className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-300">
                                                {asset.unit}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-gray-400">Nenhum item encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                                <Box size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-indigo-900 dark:text-white text-sm">{selectedAsset.name}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-300 font-mono">{selectedAsset.assetTag}</div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAssetId('')} className="p-1 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Transfer Flow Visual */}
            <div className="flex items-center gap-4">
                <div className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-70">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Origem atual</span>
                    <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm">
                        <MapPin size={14} />
                        {selectedAsset ? selectedAsset.unit : '...'}
                    </div>
                </div>

                <div className="text-indigo-300 dark:text-indigo-600">
                    <ArrowRight size={24} />
                </div>

                <div className="flex-1">
                    <div className={`p-3 rounded-xl border-2 transition-all ${targetUnit ? 'border-indigo-500 bg-white dark:bg-slate-800' : 'border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/30'}`}>
                        <span className="text-[10px] uppercase font-bold text-indigo-500 block mb-1">Destino</span>
                        <select 
                            className="w-full bg-transparent outline-none font-bold text-sm text-slate-800 dark:text-white disabled:cursor-not-allowed"
                            value={targetUnit}
                            onChange={(e) => setTargetUnit(e.target.value as Unit)}
                            disabled={!selectedAsset}
                        >
                            <option value="">Selecione...</option>
                            {Object.values(Unit)
                                .filter(u => u !== selectedAsset?.unit)
                                .map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 font-bold rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-sm">
                Cancelar
            </button>
            <button 
                onClick={handleConfirm}
                disabled={!selectedAsset || !targetUnit}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                <ArrowRightLeft className="w-4 h-4" />
                Confirmar Transferência
            </button>
        </div>

      </div>
    </div>
  );
};
