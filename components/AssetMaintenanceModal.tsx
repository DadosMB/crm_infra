
import React, { useState, useMemo } from 'react';
import { Asset, MaintenanceRecord, AssetStatus } from '../types';
import { X, Search, Box, Calendar, Wrench, Truck, Phone, User as UserIcon } from 'lucide-react';

interface AssetMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onRegisterMaintenance: (record: MaintenanceRecord) => void;
}

export const AssetMaintenanceModal: React.FC<AssetMaintenanceModalProps> = ({ isOpen, onClose, assets, onRegisterMaintenance }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [providerName, setProviderName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [dateOut, setDateOut] = useState(new Date().toISOString().split('T')[0]);
  const [dateReturnForecast, setDateReturnForecast] = useState('');
  const [description, setDescription] = useState('');

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAssetId('');
      setSearchTerm('');
      setProviderName('');
      setContactInfo('');
      setDateOut(new Date().toISOString().split('T')[0]);
      setDateReturnForecast('');
      setDescription('');
    }
  }, [isOpen]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId), 
  [assets, selectedAssetId]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets.filter(a => a.status === AssetStatus.ATIVO || a.status === AssetStatus.INATIVO);
    const lower = searchTerm.toLowerCase();
    // Only allow selecting assets that are NOT already in maintenance or written off
    return assets.filter(a => 
      (a.status === AssetStatus.ATIVO || a.status === AssetStatus.INATIVO) &&
      (a.name.toLowerCase().includes(lower) || a.assetTag.toLowerCase().includes(lower))
    );
  }, [assets, searchTerm]);

  const handleConfirm = () => {
    if (selectedAssetId && providerName && dateOut && description) {
      const record: MaintenanceRecord = {
          id: `mr-${Date.now()}`,
          assetId: selectedAssetId,
          providerName,
          contactInfo,
          dateOut: new Date(dateOut + 'T12:00:00').toISOString(),
          dateReturnForecast: dateReturnForecast ? new Date(dateReturnForecast + 'T12:00:00').toISOString() : undefined,
          description,
          active: true
      };
      onRegisterMaintenance(record);
      onClose();
    } else {
        alert("Preencha todos os campos obrigatórios (Bem, Prestador, Data de Saída e Motivo).");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 shrink-0">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Saída para Manutenção
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registrar envio de equipamento para reparo externo.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* 1. Select Asset */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Selecione o Bem *</label>
                {!selectedAsset ? (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 pl-10 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400"
                            placeholder="Buscar item disponível..."
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
                                            className="w-full text-left p-3 hover:bg-amber-50 dark:hover:bg-slate-600 border-b border-gray-50 dark:border-slate-600 last:border-0 flex justify-between items-center group transition-colors"
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
                                    <div className="p-4 text-center text-xs text-gray-400">Nenhum item disponível encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                                <Box size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-amber-900 dark:text-white text-sm">{selectedAsset.name}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-300 font-mono">{selectedAsset.assetTag} - {selectedAsset.unit}</div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAssetId('')} className="p-1 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full text-amber-400 hover:text-amber-600 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Prestador / Responsável *</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-2.5 pl-10 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Ex: TEC SERVICES ou Técnico João"
                            value={providerName}
                            onChange={e => setProviderName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Contato (Tel/Whatsapp)</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-2.5 pl-10 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="(XX) XXXXX-XXXX"
                            value={contactInfo}
                            onChange={e => setContactInfo(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Data de Saída *</label>
                    <input 
                        type="date" 
                        className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        value={dateOut}
                        onChange={e => setDateOut(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Previsão Retorno</label>
                    <input 
                        type="date" 
                        className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        value={dateReturnForecast}
                        onChange={e => setDateReturnForecast(e.target.value)}
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Motivo / Descrição *</label>
                    <textarea 
                        className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-700/50 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                        rows={3}
                        placeholder="Ex: Troca de cabo de alimentação, reparo na placa..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 font-bold rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-sm">
                Cancelar
            </button>
            <button 
                onClick={handleConfirm}
                disabled={!selectedAsset || !providerName || !dateOut || !description}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                <Truck className="w-4 h-4" />
                Registrar Saída
            </button>
        </div>

      </div>
    </div>
  );
};
