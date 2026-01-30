
import { OSPriority, OSStatus, OSType, AssetWarranty } from './types';

export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getPriorityColor = (priority: OSPriority | string) => {
  switch (priority) {
    case OSPriority.ALTA:
    case 'high':
      return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 ring-1 ring-red-100 dark:ring-red-900/20';
    case OSPriority.MEDIA:
    case 'medium':
      return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 ring-1 ring-amber-100 dark:ring-amber-900/20';
    case OSPriority.BAIXA:
    case 'low':
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-100 dark:ring-emerald-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700';
  }
};

export const getStatusBadge = (status: OSStatus) => {
  switch (status) {
    case OSStatus.ABERTA: return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case OSStatus.EM_ANDAMENTO: return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    case OSStatus.AGUARDANDO: return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    case OSStatus.CONCLUIDA: return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    case OSStatus.CANCELADA: return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
    default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
  }
};

export const getTypeBadgeStyle = (type: OSType) => {
  switch (type) {
    case OSType.PREVENTIVA: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case OSType.CORRETIVA: return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    case OSType.INSTALACAO: return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case OSType.OUTROS: return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    default: return 'bg-gray-50 text-gray-600';
  }
};

export const getWarrantyStatus = (warranty: AssetWarranty): 'active' | 'expired' | 'none' => {
  if (!warranty.hasWarranty || !warranty.endDate) return 'none';
  
  const end = new Date(warranty.endDate);
  const now = new Date();
  // Reset time part for accurate date comparison
  now.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  return end >= now ? 'active' : 'expired';
};
