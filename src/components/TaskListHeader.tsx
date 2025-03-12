import React from 'react';
import { Plus } from 'lucide-react';

interface TaskListHeaderProps {
  onCreateTask: () => void;
}

export function TaskListHeader({ onCreateTask }: TaskListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task List</h1>
      
      <button
        onClick={onCreateTask}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>
    </div>
  );
}