/*
  # Add Priority field to tasks table

  1. Changes
    - Add `priority` column to `tasks` table with values P1-P5
    - Set default value to 'P3'
    - Add check constraint to ensure only valid priority values
*/

ALTER TABLE tasks 
ADD COLUMN priority text NOT NULL DEFAULT 'P3'
CHECK (priority IN ('P1', 'P2', 'P3', 'P4', 'P5'));