
-- Add parent_task_id column to tasks table if it doesn't exist
-- (This should already exist based on the schema, but let's make sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for parent_task_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_parent_task_id_fkey'
    ) THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_parent_task_id_fkey 
        FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update completed goals to be marked as completed
UPDATE goals SET completed = true WHERE progress >= 100 AND completed = false;

-- Create index for better performance on parent_task_id queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);
