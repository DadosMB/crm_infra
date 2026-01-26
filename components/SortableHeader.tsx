import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey?: string;
  currentSortKey?: string;
  direction?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
  align = 'left',
  width,
  className
}) => {
  return (
    <th
      className={`
          px-4 py-3 font-semibold text-xs uppercase tracking-wider transition-colors select-none
          ${width ? width : ''}
          ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
          ${sortKey ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 group' : ''}
          ${currentSortKey === sortKey && sortKey ? 'bg-gray-50 dark:bg-slate-700/50 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'}
          ${className || ''}
      `}
      onClick={() => sortKey && onSort && onSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {sortKey && onSort && (
          <span className="text-gray-400 dark:text-slate-500">
            {currentSortKey === sortKey ? (
              direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};
