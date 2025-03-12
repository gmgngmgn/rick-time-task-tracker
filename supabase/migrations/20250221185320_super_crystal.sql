/*
  # Add CASCADE DELETE to task_history foreign key

  1. Changes
    - Drops the existing foreign key constraint on task_history.task_id
    - Adds a new foreign key constraint with ON DELETE CASCADE
    - This ensures that when a task is deleted, all related task history records are automatically deleted

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

DO $$ 
BEGIN
  -- Drop the existing foreign key constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_history_task_id_fkey'
    AND table_name = 'task_history'
  ) THEN
    ALTER TABLE task_history DROP CONSTRAINT task_history_task_id_fkey;
  END IF;

  -- Add the new foreign key constraint with ON DELETE CASCADE
  ALTER TABLE task_history
    ADD CONSTRAINT task_history_task_id_fkey
    FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE;
END $$;