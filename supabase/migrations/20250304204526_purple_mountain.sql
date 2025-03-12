/*
  # Add due date to tasks table

  1. Changes
    - Add `due_date` column to `tasks` table (nullable timestamptz)
    - Add index on `due_date` for better query performance

  2. Notes
    - Column is nullable since not all tasks may have due dates
    - Using timestamptz to properly handle timezone differences
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamptz;
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);