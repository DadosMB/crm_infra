
import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetStatus, AssetCategory, Unit, AssetWarranty, AssetInvoiceInfo } from '../types';
import { X, Save, Camera, UploadCloud, FileText, Shield, Calendar, DollarSign, Tag, MapPin, Box, Trash2 } from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null; // null = creating new
  onSave: (asset: Asset) => void;
  isReadOnly?: boolean;
  categories: string[]; // Added categories prop
}

export const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, asset, onSave, isReadOnly = false, categories }) => {
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isOpen) {
          if (asset) {
              setFormData(JSON.parse(JSON.stringify(asset))); // Deep copy to avoid reference issues
          } else {
              // Defaults for new asset
              setFormData({
                  id: `ast-${Date.now()}`,
                  assetTag: '',
                  name: '',
                  unit: Unit.ALDEOTA,
                  category: AssetCategory.OUTROS,
                  status: AssetStatus.ATIVO,
                  registrationDate: new Date().toISOString(),
                  warranty: { hasWarranty: false },
                  invoiceInfo: {},
                  linkedOSIds: []
              });
          }
      }
  }, [isOpen, asset]);

  if (!isOpen) return null;

  const handleSave = () => {
      if (isReadOnly) return;
      
      // Basic Validation
      if (!formData.assetTag || !formData.name) {
          alert('Número do Patrimônio e Nome do Bem são obrigatórios.');
          return;
      }

      onSave(formData as Asset);
      onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  // Helper for inputs
  const inputClass = `w-full border border-gray-200 dark:border-slate-600 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all placeholder-gray-400 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`;
  const numberInputClass = `${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        {asset ? (isReadOnly ? 'Detalhes do Bem' : 'Editar Patrimônio') : 'Novo Cadastro de Bem'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {asset ? asset.assetTag : 'Preencha os dados do novo equipamento'}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                
                {/* 1. Main Info Grid */}
                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Photo Uploader */}
                    <div className="w-full md:w-48 shrink-0 flex flex-col items-center gap-3">
                        <div 
                            className={`w-40 h-40 rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden group transition-all ${isReadOnly ? 'border-slate-300 bg-slate-100' : 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10 cursor-pointer hover:border-indigo-500'}`}
                            onClick={() => !isReadOnly && fileInputRef.current?.click()}
                        >
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} alt="Asset" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <Camera className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                                    <span className="text-xs text-indigo-500 font-bold">Adicionar Foto</span>
                                </div>
                            )}
                            
                            {!isReadOnly && formData.photoUrl && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isReadOnly} />
                        {!isReadOnly && <p className="text-[10px] text-slate-400 text-center">Clique na imagem para alterar</p>}
                    </div>

                    {/* Basic Data Fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Número Patrimônio *</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    className={`${inputClass} pl-10 font-mono font-bold text-indigo-700 dark:text-indigo-300 uppercase`}
                                    value={formData.assetTag || ''}
                                    onChange={e => setFormData({...formData, assetTag: e.target.value.toUpperCase()})}
                                    placeholder="Ex: MB-TI-001"
                                    disabled={isReadOnly}
                                    autoFocus={!asset && !isReadOnly}
                                />
                            </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Nome do Bem *</label>
                            <input 
                                type="text" 
                                className={inputClass}
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Notebook Dell Vostro"
                                disabled={isReadOnly}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Categoria *</label>
                            <select 
                                className={inputClass} 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value as AssetCategory})}
                                disabled={isReadOnly}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Unidade *</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select 
                                    className={`${inputClass} pl-10`} 
                                    value={formData.unit} 
                                    onChange={e => setFormData({...formData, unit: e.target.value as Unit})}
                                    disabled={isReadOnly}
                                >
                                    {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Marca</label>
                            <input type="text" className={inputClass} value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Ex: Dell" disabled={isReadOnly} />
                        </div>

                        <div>
                            <label className={labelClass}>Modelo</label>
                            <input type="text" className={inputClass} value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Ex: Vostro 3510" disabled={isReadOnly} />
                        </div>

                        <div>
                            <label className={labelClass}>Valor Estimado (R$)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="number" 
                                    className={`${numberInputClass} pl-10`} 
                                    value={formData.value || ''} 
                                    onChange={e => setFormData({...formData, value: Number(e.target.value)})} 
                                    placeholder="0.00"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Status Atual</label>
                            <select 
                                className={inputClass} 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})}
                                disabled={isReadOnly}
                            >
                                {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t dark:border-slate-700"></div>

                {/* 2. Fiscal & Warranty Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Invoice Info (Optional) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                <FileText size={16} />
                            </div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-200">Dados da Compra (Opcional)</h4>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className={labelClass}>Fornecedor</label>
                                <input 
                                    type="text" 
                                    className={inputClass} 
                                    value={formData.invoiceInfo?.supplierName || ''} 
                                    onChange={e => setFormData({...formData, invoiceInfo: { ...formData.invoiceInfo, supplierName: e.target.value }})}
                                    placeholder="Nome da loja ou empresa"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Nota Fiscal Nº</label>
                                    <input 
                                        type="text" 
                                        className={inputClass} 
                                        value={formData.invoiceInfo?.invoiceNumber || ''} 
                                        onChange={e => setFormData({...formData, invoiceInfo: { ...formData.invoiceInfo, invoiceNumber: e.target.value }})}
                                        placeholder="000.000"
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Data Emissão</label>
                                    <input 
                                        type="date" 
                                        className={inputClass} 
                                        value={formData.invoiceInfo?.invoiceDate || ''} 
                                        onChange={e => setFormData({...formData, invoiceInfo: { ...formData.invoiceInfo, invoiceDate: e.target.value }})}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                            
                            {/* Simple PDF Upload Mock */}
                            <div className="pt-2">
                                <button 
                                    className={`w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors ${!isReadOnly && 'hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}
                                    onClick={() => !isReadOnly && pdfInputRef.current?.click()}
                                    disabled={isReadOnly}
                                >
                                    {formData.invoiceInfo?.invoiceUrl ? (
                                        <><FileText size={14} className="text-emerald-500"/> PDF Anexado (Clique para alterar)</>
                                    ) : (
                                        <><UploadCloud size={14} /> Anexar PDF da Nota</>
                                    )}
                                </button>
                                <input type="file" ref={pdfInputRef} className="hidden" accept="application/pdf" disabled={isReadOnly} />
                            </div>
                        </div>
                    </div>

                    {/* Warranty Info (Toggle) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
                                    <Shield size={16} />
                                </div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">Garantia</h4>
                            </div>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={formData.warranty?.hasWarranty || false}
                                    onChange={e => setFormData({...formData, warranty: { ...formData.warranty, hasWarranty: e.target.checked }})}
                                    disabled={isReadOnly}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-300">{formData.warranty?.hasWarranty ? 'Sim' : 'Não'}</span>
                            </label>
                        </div>

                        {formData.warranty?.hasWarranty ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Início</label>
                                        <input 
                                            type="date" 
                                            className={inputClass} 
                                            value={formData.warranty.startDate || ''} 
                                            onChange={e => setFormData({...formData, warranty: { ...formData.warranty!, startDate: e.target.value }})}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Término</label>
                                        <input 
                                            type="date" 
                                            className={inputClass} 
                                            value={formData.warranty.endDate || ''} 
                                            onChange={e => setFormData({...formData, warranty: { ...formData.warranty!, endDate: e.target.value }})}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Observações</label>
                                    <textarea 
                                        className={inputClass} 
                                        rows={2} 
                                        placeholder="Ex: Garantia estendida on-site..." 
                                        value={formData.warranty.notes || ''}
                                        onChange={e => setFormData({...formData, warranty: { ...formData.warranty!, notes: e.target.value }})}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
                                <Shield className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs font-medium">Sem garantia registrada</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div>
                    <label className={labelClass}>Observações Gerais</label>
                    <textarea 
                        className={inputClass} 
                        rows={3} 
                        placeholder="Detalhes adicionais sobre o estado do bem, localização específica, etc."
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        disabled={isReadOnly}
                    />
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 font-bold rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                    Cancelar
                </button>
                {!isReadOnly && (
                    <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95">
                        <Save className="w-4 h-4" />
                        Salvar Bem
                    </button>
                )}
            </div>

        </div>
    </div>
  );
};
