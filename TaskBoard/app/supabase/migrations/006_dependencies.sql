ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_by uuid[] DEFAULT '{}';
