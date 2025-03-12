import { useRef } from 'react';
import { MoreVertical } from 'lucide-react';

interface TaskMenuProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  taskId?: string;
}

export function TaskMenu({ isOpen, onToggle, onEdit, onDelete, taskId }: TaskMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative task-menu ${isOpen ? 'z-50' : ''}`}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
      
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="presentation">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              type="button"
              role="menuitem"
            >
              Edit Name
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
              type="button"
              role="menuitem"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}