
import React, { useRef, useState } from 'react';
import { Asset, AssetCategory, AssetStatus, Unit } from '../types';
import { X, UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newAssets: Asset[]) => void;
}

export const AssetImportModal: React.FC<AssetImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  // Função para baixar o modelo
  const handleDownloadTemplate = () => {
    const headers = ['Patrimonio', 'Nome', 'Categoria', 'Unidade', 'Marca', 'Modelo', 'Valor', 'Data Aquisicao (DD/MM/AAAA)'];
    const exampleRow = ['MB-TI-999', 'Notebook Dell Latitude', 'TI / Informática', 'Aldeota', 'Dell', '5420', '4500.00', '15/05/2025'];
    
    const csvContent = "data:text/csv;charset=utf-8," + 
        [headers.join(','), exampleRow.join(',')].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_importacao_patrimonio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper para converter data DD/MM/YYYY para ISO
  const parseDate = (dateStr: string): string => {
      try {
          if (!dateStr) return new Date().toISOString();
          const parts = dateStr.split('/');
          if (parts.length === 3) {
              // DD/MM/YYYY -> YYYY-MM-DD
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
          }
          return new Date().toISOString();
      } catch (e) {
          return new Date().toISOString();
      }
  };

  // Processar o arquivo CSV
  const processFile = (file: File) => {
      setError(null);
      setSuccessCount(null);

      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) return;

          try {
              const lines = text.split('\n');
              const newAssets: Asset[] = [];
              
              // Começa do índice 1 para pular o cabeçalho
              for (let i = 1; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;

                  // Regex para separar por vírgula, ignorando vírgulas dentro de aspas
                  const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

                  // Validação básica: Precisa ter pelo menos Patrimonio e Nome
                  if (cols.length < 2 || !cols[0] || !cols[1]) continue;

                  // Mapeamento (Safe defaults)
                  const categoryInput = cols[2] || '';
                  const unitInput = cols[3] || '';
                  
                  // Tenta encontrar a categoria correta, ou usa OUTROS
                  const category = Object.values(AssetCategory).find(c => c.toLowerCase() === categoryInput.toLowerCase()) || AssetCategory.OUTROS;
                  
                  // Tenta encontrar a unidade correta, ou usa ALDEOTA (Default seguro)
                  const unit = Object.values(Unit).find(u => u.toLowerCase() === unitInput.toLowerCase()) || Unit.ALDEOTA;

                  const asset: Asset = {
                      id: `ast-imp-${Date.now()}-${i}`,
                      assetTag: cols[0],
                      name: cols[1],
                      category: category as AssetCategory,
                      unit: unit as Unit,
                      brand: cols[4] || '',
                      model: cols[5] || '',
                      value: parseFloat(cols[6]) || 0,
                      registrationDate: parseDate(cols[7]), // Data Aquisicao
                      status: AssetStatus.ATIVO, // Default status
                      warranty: { hasWarranty: false }, // Default sem garantia
                      invoiceInfo: {},
                      linkedOSIds: []
                  };

                  newAssets.push(asset);
              }

              if (newAssets.length === 0) {
                  setError("Nenhum item válido encontrado no arquivo. Verifique o formato.");
              } else {
                  onImport(newAssets);
                  setSuccessCount(newAssets.length);
                  setTimeout(() => {
                      onClose();
                      setSuccessCount(null);
                  }, 2000);
              }

          } catch (err) {
              setError("Erro ao ler o arquivo CSV. Certifique-se que está formatado corretamente.");
          }
      };
      reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
          processFile(file);
      } else {
          setError("Por favor, envie apenas arquivos .csv");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          processFile(file);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Importação em Massa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Adicione múltiplos itens via planilha Excel/CSV.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        {!successCount ? (
            <div className="p-6 space-y-6">
                
                {/* Instructions Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">Como funciona?</h4>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc pl-4">
                                <li>Baixe o modelo abaixo para garantir o formato correto.</li>
                                <li>Preencha os dados no Excel e salve como <strong>.CSV (Separado por vírgulas)</strong>.</li>
                                <li>Categorias e Unidades serão ajustadas automaticamente se houver pequenos erros de digitação.</li>
                                <li>Você poderá editar fotos e detalhes finos após a importação.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Template Download */}
                <button 
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm group"
                >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    Baixar Planilha Modelo (.csv)
                </button>

                {/* Upload Area */}
                <div 
                    className={`
                        border-2 border-dashed rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                        ${isDragOver 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]' 
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-700'}
                    `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv,text/csv" 
                        onChange={handleFileChange}
                    />
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-3">
                        <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Clique ou arraste seu arquivo aqui</p>
                    <p className="text-xs text-slate-400 mt-1">Apenas arquivos .csv</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs font-bold animate-pulse">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>
        ) : (
            <div className="p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Sucesso!</h3>
                <p className="text-slate-500 dark:text-slate-400">
                    <strong className="text-emerald-600 dark:text-emerald-400">{successCount}</strong> itens foram importados para o sistema.
                </p>
                <p className="text-xs text-slate-400 mt-4">Fechando em instantes...</p>
            </div>
        )}

      </div>
    </div>
  );
};
