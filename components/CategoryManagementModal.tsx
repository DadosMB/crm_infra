
import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Layers } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory
}) => {
  const [newCategory, setNewCategory] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
        alert('Esta categoria já existe.');
        return;
    }
    onAddCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleAdd();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Categorias de Bens
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 space-y-6">
            
            {/* Add New */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nova Categoria</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="flex-1 border border-gray-300 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-gray-400"
                        placeholder="Ex: Veículos, Ferramentas..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button 
                        onClick={handleAdd}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 border-b dark:border-slate-700 pb-2">Categorias Cadastradas ({categories.length})</h4>
                <div className="space-y-2">
                    {categories.map((cat, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-600 rounded-lg text-slate-400 dark:text-slate-300 shadow-sm">
                                    <Tag size={16} />
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cat}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    if(confirm(`Remover categoria "${cat}"?`)) {
                                        onDeleteCategory(cat);
                                    }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">Nenhuma categoria cadastrada.</p>
                    )}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-colors">
                Concluir
            </button>
        </div>
      </div>
    </div>
  );
};
