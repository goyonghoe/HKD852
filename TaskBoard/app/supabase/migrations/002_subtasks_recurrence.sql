-- Subtasks: parent-child task relationships
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);

-- Recurring tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('daily', 'weekly', 'monthly'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_source_id uuid;
