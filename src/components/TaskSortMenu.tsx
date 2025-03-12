import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { SortField, SortOrder } from '../types/task';

interface TaskSortMenuProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  isMobile?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function TaskSortMenu({
  sortField,
  sortOrder,
  onSort,
  isMobile = false,
  isOpen,
  onToggle
}: TaskSortMenuProps) {
  const getSortFieldLabel = (field: SortField): string => {
    switch (field) {
      case 'name':
        return 'Task Name';
      case 'last_start_time':
        return 'Last Start Time';
      case 'total_elapsed_time':
        return 'Total Time';
      case 'priority':
        return 'Priority';
      default:
        return field;
    }
  };

  if (isMobile) {
    return (
      <div className="relative mobile-sort-menu">
        <button
          onClick={onToggle}
          className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {getSortFieldLabel(sortField)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </span>
            {sortOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-3 py-2">
                Sort Field
              </div>
              {(['name', 'priority', 'last_start_time', 'total_elapsed_time'] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => onSort(field)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    sortField === field
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{getSortFieldLabel(field)}</span>
                  {sortField === field && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4 px-6 py-3">
      {(['name', 'priority', 'last_start_time', 'total_elapsed_time'] as SortField[]).map((field) => (
        <button
          key={field}
          className="flex items-center gap-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          onClick={() => onSort(field)}
        >
          {getSortFieldLabel(field)}
          <ArrowUpDown className="w-4 h-4" />
        </button>
      ))}
      <div className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Action
      </div>
    </div>
  );
}