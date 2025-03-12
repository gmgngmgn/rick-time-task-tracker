/*
  # Add task history tracking

  1. New Tables
    - `task_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `task_id` (uuid, references tasks)
      - `start_date` (date)
      - `elapsed_time` (interval)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `task_history` table
    - Add policies for authenticated users to:
      - Read their own task history
      - Create/update their own task history
      - Delete their own task history

  3. Changes
    - Add indexes for performance optimization
*/

-- Create task history table
CREATE TABLE IF NOT EXISTS task_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    task_id uuid REFERENCES tasks(id) NOT NULL,
    start_date date NOT NULL,
    elapsed_time interval DEFAULT '0 seconds'::interval,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own task history"
    ON task_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task history"
    ON task_history
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task history"
    ON task_history
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task history"
    ON task_history
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS task_history_user_id_idx ON task_history(user_id);
CREATE INDEX IF NOT EXISTS task_history_task_id_idx ON task_history(task_id);
CREATE INDEX IF NOT EXISTS task_history_start_date_idx ON task_history(start_date);
CREATE INDEX IF NOT EXISTS task_history_composite_idx ON task_history(user_id, task_id, start_date);