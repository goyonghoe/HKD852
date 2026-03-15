-- TaskBoard: Initial Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog','thisweek','today','in_progress','waiting','done')),
  priority text CHECK (priority IN ('critical','high','mid','low')),
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  tags text[] DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  scheduled_date date,
  scheduled_start time,
  scheduled_end time,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Time logs (estimation accuracy history)
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  estimated_hours numeric(5,2) NOT NULL,
  actual_hours numeric(5,2) NOT NULL,
  ratio numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN estimated_hours > 0 THEN actual_hours / estimated_hours ELSE 0 END
  ) STORED,
  category text DEFAULT 'familiar',
  logged_at timestamptz DEFAULT now()
);

-- 3. Settings (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  correction_factor numeric(3,1) DEFAULT 2.0,
  daily_capacity_hours numeric(3,1) DEFAULT 8.0,
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (correction_factor, daily_capacity_hours)
VALUES (2.0, 8.0)
ON CONFLICT (id) DO NOTHING;

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);

-- 6. RLS (Row Level Security) — disabled for personal use
-- Enable if you ever share this project
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (personal use, single user)
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON time_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON settings FOR ALL USING (true) WITH CHECK (true);
