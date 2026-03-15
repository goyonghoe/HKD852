CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text NOT NULL,
  action text NOT NULL, -- 'created', 'updated', 'moved', 'completed', 'deleted', 'restored'
  field_changed text, -- 'status', 'priority', 'title', etc.
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_task ON activity_log(task_id);
