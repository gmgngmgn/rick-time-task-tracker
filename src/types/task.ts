// Types related to tasks
export interface Task {
  id: string;
  name: string;
  last_start_time: string | null;
  is_running: boolean;
  total_elapsed_time: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
}

export type SortField = 'name' | 'last_start_time' | 'total_elapsed_time' | 'priority';
export type SortOrder = 'asc' | 'desc';

export const PRIORITY_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;