
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { X, Pencil, Trash2, Shield, ShieldAlert, Check, Save, User as UserIcon, Camera, Mail, Lock, Briefcase } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ 
    isOpen, 
    onClose, 
    users, 
    currentUser, 
    onUpdateUser,
    onDeleteUser
}) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening/closing
  useEffect(() => {
      if(isOpen) {
          // If admin, show list. If simple user, go straight to edit self.
          if (currentUser.isAdmin) {
              setView('list');
              setEditingUser(null);
          } else {
              setEditingUser(currentUser);
              setFormData({ ...currentUser });
              setView('edit');
          }
      }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Filter users based on permissions
  const visibleUsers = currentUser.isAdmin 
    ? users 
    : users.filter(u => u.id === currentUser.id);

  const handleEditClick = (user: User) => {
      setEditingUser(user);
      setFormData({ ...user });
      setView('edit');
  };

  const handleBack = () => {
      // If admin, go back to list. If user, close modal.
      if (currentUser.isAdmin) {
          setView('list');
          setEditingUser(null);
          setFormData({});
      } else {
          onClose();
      }
  };

  const handleSave = () => {
      if(editingUser && formData) {
          const updatedUser = { ...editingUser, ...formData } as User;
          onUpdateUser(updatedUser);
          handleBack();
      }
  };

  const handleDelete = () => {
      if(editingUser) {
          if(confirm(`Tem certeza que deseja excluir o usuário ${editingUser.name}? Essa ação não pode ser desfeita.`)) {
              onDeleteUser(editingUser.id);
              handleBack();
          }
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const inputClass = "w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500";

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                {view === 'list' ? 'Gerenciar Usuários' : 'Editar Perfil'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800">
            
            {/* VIEW: LIST (Only visible to admins) */}
            {view === 'list' && (
                <div className="space-y-4">
                    {visibleUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm overflow-hidden border-2 border-white dark:border-slate-600 ${!user.avatarUrl ? user.color : ''}`}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.initials
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{user.name} {user.id === currentUser.id && <span className="text-xs font-normal text-indigo-500 ml-1">(Você)</span>}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{user.role}</span>
                                        {user.isAdmin && (
                                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <Shield size={10} /> Admin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleEditClick(user)}
                                className="p-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors shadow-sm"
                            >
                                <Pencil size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* VIEW: EDIT */}
            {view === 'edit' && editingUser && (
                <div className="space-y-6">
                    {/* Logic Vars */}
                    {(() => {
                        // User can change their own photo. Admin cannot change other's photo.
                        const isSelf = editingUser.id === currentUser.id;
                        const canEditPhoto = isSelf; 
                        
                        // Admin can change everything else for others. User cannot change text details.
                        const canEditDetails = currentUser.isAdmin; 

                        return (
                            <>
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center">
                                    <div 
                                        className={`relative ${canEditPhoto ? 'group cursor-pointer' : ''}`} 
                                        onClick={() => canEditPhoto && fileInputRef.current?.click()}
                                    >
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ring-4 ring-gray-50 dark:ring-slate-700 transition-all ${!formData.avatarUrl ? editingUser.color : 'bg-gray-200'}`}>
                                            {formData.avatarUrl ? (
                                                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                editingUser.initials
                                            )}
                                        </div>
                                        {canEditPhoto && (
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white w-8 h-8" />
                                            </div>
                                        )}
                                        {canEditPhoto && (
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        )}
                                    </div>
                                    {canEditPhoto && <p className="text-xs text-gray-400 mt-2">Clique para alterar a foto</p>}
                                    {!canEditPhoto && <p className="text-xs text-gray-400 mt-2 italic">Foto gerida pelo usuário</p>}
                                </div>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nome Completo</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                className={`${inputClass} pl-10 ${!canEditDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                value={formData.name || ''}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                readOnly={!canEditDetails}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="email" 
                                                className={`${inputClass} pl-10 ${!canEditDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                value={formData.email || ''}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                readOnly={!canEditDetails}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Senha</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input 
                                                type="text" 
                                                className={`${inputClass} pl-10 ${!canEditDetails ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                value={formData.password || ''}
                                                onChange={e => setFormData({...formData, password: e.target.value})}
                                                readOnly={!canEditDetails}
                                            />
                                        </div>
                                    </div>

                                    {/* Role & Permissions (Visible only if user is admin, but readable/editable based on logic) */}
                                    {currentUser.isAdmin && (
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-slate-700">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Cargo / Função</label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        className={`${inputClass} pl-10`}
                                                        value={formData.role || ''}
                                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-2 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${formData.isAdmin ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'}`}>
                                                        <Shield size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Acesso Administrador</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Permissão total ao sistema</p>
                                                    </div>
                                                </div>
                                                
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={formData.isAdmin || false}
                                                        onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                                                        disabled={editingUser.id === currentUser.id} // Cannot remove own admin status to prevent lockout
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between">
            {view === 'edit' ? (
                <>
                    {/* Delete button only visible to admins AND not deleting themselves */}
                    {currentUser.isAdmin && editingUser?.id !== currentUser.id ? (
                        <button onClick={handleDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                            <Trash2 size={16} /> Excluir
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}
                    <div className="flex gap-2">
                        <button onClick={handleBack} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
                            <Save className="w-4 h-4" /> Salvar
                        </button>
                    </div>
                </>
            ) : (
                <div className="w-full flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Fechar
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
