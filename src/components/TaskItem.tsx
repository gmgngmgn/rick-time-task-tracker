import React from 'react';
import { Task, PRIORITY_OPTIONS } from '../types/task';
import { formatDateTime, formatElapsedTime, getPriorityColor } from '../utils/formatters';
import { TaskMenu } from './TaskMenu';

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  editingName: string;
  isMenuOpen: boolean;
  onEditingNameChange: (value: string) => void;
  onUpdateName: () => void;
  onUpdatePriority: (priority: Task['priority']) => void;
  onStartTask: () => void;
  onStopTask: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  isMobile?: boolean;
}

export function TaskItem({
  task,
  isEditing,
  editingName,
  isMenuOpen,
  onEditingNameChange,
  onUpdateName,
  onUpdatePriority,
  onStartTask,
  onStopTask,
  onMenuToggle,
  onEdit,
  onDelete,
  isMobile = false
}: TaskItemProps) {
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[DEBUG] TaskItem: onMenuToggle called');
    onMenuToggle(e);
  };

  const handleEdit = () => {
    console.log('[DEBUG] TaskItem: handleEdit called');
    onEdit();
  };

  const handleDelete = () => {
    console.log('[DEBUG] TaskItem: handleDelete called');
    onDelete();
  };

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-2">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onBlur={onUpdateName}
                onKeyDown={(e) => e.key === 'Enter' && onUpdateName()}
                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                ref={(input) => input?.focus()}
              />
            ) : (
              <h3 className="font-medium text-gray-900 dark:text-white">{task.name}</h3>
            )}
          </div>
          <div className="relative">
            <TaskMenu
              isOpen={isMenuOpen}
              onToggle={handleMenuToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              taskId={task.id}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Priority:</p>
            <select
              value={task.priority}
              onChange={(e) => onUpdatePriority(e.target.value as Task['priority'])}
              className={`mt-1 w-full px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${getPriorityColor(task.priority)}`}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Elapsed Time:</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {task.total_elapsed_time ? formatElapsedTime(task.total_elapsed_time) : '0h 0m'}
            </p>
          </div>
        </div>
        
        <div className="mb-3 text-sm">
          <p className="text-gray-500 dark:text-gray-400">Last Start Time:</p>
          <p className="text-gray-900 dark:text-white">
            {task.last_start_time ? formatDateTime(task.last_start_time) : 'Not started'}
          </p>
        </div>
        
        <div className="flex justify-end">
          {!task.is_running ? (
            <button
              type="button"
              onClick={onStartTask}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopTask}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-5 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${isMenuOpen ? 'relative z-40' : ''}`}>
      <div className="flex items-center">
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onBlur={onUpdateName}
            onKeyDown={(e) => e.key === 'Enter' && onUpdateName()}
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            ref={(input) => input?.focus()}
          />
        ) : (
          <div className="flex items-center gap-2 relative">
            <span className="text-gray-900 dark:text-white">{task.name}</span>
            <div className="relative">
              <TaskMenu
                isOpen={isMenuOpen}
                onToggle={handleMenuToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                taskId={task.id}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <select
          value={task.priority}
          onChange={(e) => onUpdatePriority(e.target.value as Task['priority'])}
          className={`px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${getPriorityColor(task.priority)}`}
        >
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>
      <div className="text-gray-900 dark:text-white">
        {task.last_start_time && formatDateTime(task.last_start_time)}
      </div>
      <div className="text-gray-900 dark:text-white">
        {task.total_elapsed_time && formatElapsedTime(task.total_elapsed_time)}
      </div>
      <div className="flex items-center gap-2">
        {!task.is_running ? (
          <button
            type="button"
            onClick={onStartTask}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopTask}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}