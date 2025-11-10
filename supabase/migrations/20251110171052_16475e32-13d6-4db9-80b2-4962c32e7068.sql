-- Add google_task_id column to tasks table to track synchronized tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_task_id text UNIQUE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_google_task_id ON tasks(google_task_id) WHERE google_task_id IS NOT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN tasks.google_task_id IS 'ID of the corresponding Google Task if synchronized';