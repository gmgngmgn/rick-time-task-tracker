import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { TaskListHeader } from '../components/TaskListHeader';
import { TaskSortMenu } from '../components/TaskSortMenu';
import { TaskItem } from '../components/TaskItem';
import { Task, SortField, SortOrder } from '../types/task';
import { intervalToMilliseconds, millisecondsToInterval } from '../utils/formatters';

export function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('last_start_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [mobileSortMenuOpen, setMobileSortMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu && !(event.target as Element).closest('.task-menu')) {
        console.log(`[DEBUG] Click outside detected. Closing menu: ${openMenu}`);
        setOpenMenu(null);
      }
      
      if (mobileSortMenuOpen && !(event.target as Element).closest('.mobile-sort-menu')) {
        setMobileSortMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenu, mobileSortMenuOpen]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          navigate('/signin');
          return;
        }

        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order(sortField === 'total_elapsed_time' ? 'total_elapsed_time' : sortField, { ascending: sortOrder === 'asc' });

        if (error) throw error;

        if (sortField === 'total_elapsed_time') {
          const sortedData = [...(data || [])].sort((a, b) => {
            const aMs = intervalToMilliseconds(a.total_elapsed_time);
            const bMs = intervalToMilliseconds(b.total_elapsed_time);
            return sortOrder === 'asc' ? aMs - bMs : bMs - aMs;
          });
          setTasks(sortedData);
        } else {
          setTasks(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate, sortField, sortOrder]);

  const handleCreateTask = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.user.id,
            name: 'New Task',
            total_elapsed_time: '00:00:00',
            priority: 'P3'
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTasks([data, ...tasks]);
        setEditingTask(data.id);
        setEditingName('New Task');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('tasks')
        .update({
          last_start_time: now,
          is_running: true,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId
          ? { ...task, last_start_time: now, is_running: true }
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start task');
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.last_start_time) return;

      const elapsedTime = new Date().getTime() - new Date(task.last_start_time).getTime();
      const previousElapsedTime = intervalToMilliseconds(task.total_elapsed_time);
      const totalElapsedTime = elapsedTime + previousElapsedTime;
      const intervalFormat = millisecondsToInterval(totalElapsedTime);

      const startDate = new Date(task.last_start_time).toISOString().split('T')[0];
      
      const { data: existingHistory } = await supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .eq('start_date', startDate);

      if (existingHistory && existingHistory.length > 0) {
        const existingMs = intervalToMilliseconds(existingHistory[0].elapsed_time);
        const newTotalMs = existingMs + elapsedTime;
        
        const { error: updateError } = await supabase
          .from('task_history')
          .update({
            elapsed_time: millisecondsToInterval(newTotalMs),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingHistory[0].id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('task_history')
          .insert([{
            user_id: user.user.id,
            task_id: taskId,
            start_date: startDate,
            elapsed_time: millisecondsToInterval(elapsedTime)
          }]);

        if (insertError) throw insertError;
      }

      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          is_running: false,
          total_elapsed_time: intervalFormat
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      setTasks(tasks.map(t => 
        t.id === taskId
          ? { 
              ...t, 
              is_running: false, 
              total_elapsed_time: intervalFormat
            }
          : t
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop task');
    }
  };

  const handleUpdateTaskName = async (taskId: string) => {
    if (!editingName.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ name: editingName })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId
          ? { ...task, name: editingName }
          : task
      ));
      setEditingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task name');
    }
  };

  const handleUpdatePriority = async (taskId: string, priority: Task['priority']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId
          ? { ...task, priority }
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task priority');
    }
  };

  const handleEditTask = (taskId: string, taskName: string) => {
    console.log('[DEBUG] handleEditTask called with taskId:', taskId, 'and name:', taskName);
    setEditingTask(taskId);
    setEditingName(taskName);
    setOpenMenu(null);
  };

  const handleDeleteTaskModal = (taskId: string) => {
    console.log('[DEBUG] handleDeleteTaskModal called with taskId:', taskId);
    setTaskToDelete(taskId);
    setDeleteModalOpen(true);
    setOpenMenu(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('[DEBUG] handleDeleteTask called with taskId:', taskId);
      
      // First delete task history records
      const { error: historyError } = await supabase
        .from('task_history')
        .delete()
        .eq('task_id', taskId);
        
      if (historyError) {
        console.error('[DEBUG] Error deleting task history:', historyError);
        throw historyError;
      }
      
      // Then delete the task itself
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('[DEBUG] Error deleting task:', error);
        throw error;
      }

      console.log('[DEBUG] Task deleted successfully');
      setTasks(tasks.filter(task => task.id !== taskId));
      setDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('[DEBUG] Error in handleDeleteTask:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setMobileSortMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 dark:bg-red-900/50 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <TaskListHeader onCreateTask={handleCreateTask} />

      {/* Desktop view */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-visible">
        <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <div className="bg-gray-50 dark:bg-gray-900">
            <TaskSortMenu
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              isOpen={false}
              onToggle={() => {}}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isEditing={editingTask === task.id}
                editingName={editingName}
                isMenuOpen={openMenu === task.id}
                onEditingNameChange={setEditingName}
                onUpdateName={() => handleUpdateTaskName(task.id)}
                onUpdatePriority={(priority) => handleUpdatePriority(task.id, priority)}
                onStartTask={() => handleStartTask(task.id)}
                onStopTask={() => handleStopTask(task.id)}
                onMenuToggle={(e) => {
                  e.stopPropagation();
                  if (openMenu && openMenu !== task.id) {
                    setOpenMenu(null);
                    setTimeout(() => {
                      setOpenMenu(task.id);
                    }, 10);
                  } else {
                    setOpenMenu(openMenu === task.id ? null : task.id);
                  }
                }}
                onEdit={() => handleEditTask(task.id, task.name)}
                onDelete={() => handleDeleteTaskModal(task.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-4">
        <TaskSortMenu
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          isMobile
          isOpen={mobileSortMenuOpen}
          onToggle={() => setMobileSortMenuOpen(!mobileSortMenuOpen)}
        />
        
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isEditing={editingTask === task.id}
            editingName={editingName}
            isMenuOpen={openMenu === task.id}
            onEditingNameChange={setEditingName}
            onUpdateName={() => handleUpdateTaskName(task.id)}
            onUpdatePriority={(priority) => handleUpdatePriority(task.id, priority)}
            onStartTask={() => handleStartTask(task.id)}
            onStopTask={() => handleStopTask(task.id)}
            onMenuToggle={(e) => {
              e.stopPropagation();
              if (openMenu && openMenu !== task.id) {
                setOpenMenu(null);
                setTimeout(() => {
                  setOpenMenu(task.id);
                }, 10);
              } else {
                setOpenMenu(openMenu === task.id ? null : task.id);
              }
            }}
            onEdit={() => handleEditTask(task.id, task.name)}
            onDelete={() => handleDeleteTaskModal(task.id)}
            isMobile
          />
        ))}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          console.log('[DEBUG] Modal onClose called');
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={() => {
          console.log('[DEBUG] Modal onConfirm called with taskToDelete:', taskToDelete);
          if (taskToDelete) {
            handleDeleteTask(taskToDelete);
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}