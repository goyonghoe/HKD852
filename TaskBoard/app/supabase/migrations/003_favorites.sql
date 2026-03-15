ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
