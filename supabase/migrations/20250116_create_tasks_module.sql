-- Create Tasks Module Database Schema (Fixed)
-- Migration: 20250116_create_tasks_module_fixed.sql
-- Fixed: Uses correct table references for RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text, -- Fallback when client_id is null
  
  -- Task details
  title text NOT NULL,
  description text,
  task_type text CHECK (task_type IN ('one-time', 'recurring', 'milestone')),
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'completed', 'cancelled')),
  
  -- Dates and deadlines
  due_date timestamptz,
  start_date timestamptz,
  completed_at timestamptz,
  
  -- Recurring task settings
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  recurrence_config jsonb, -- Stores detailed recurrence rules
  next_occurrence timestamptz,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE, -- For recurring task instances
  
  -- Assignment and tracking
  assigned_to uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  time_estimate integer, -- in minutes
  time_spent integer DEFAULT 0, -- in minutes
  
  -- SLA and compliance
  sla_deadline timestamptz,
  is_statutory boolean DEFAULT false, -- For tax deadlines like VAT-7, CIT-8
  statutory_type text, -- VAT-7, CIT-8, etc.
  
  -- Kanban specific
  board_column text DEFAULT 'backlog',
  board_order integer DEFAULT 0,
  
  -- Metadata
  tags text[],
  attachments jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Task checklist items
CREATE TABLE task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_by uuid REFERENCES users(id),
  completed_at timestamptz,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Task comments
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task templates for recurring tasks
CREATE TABLE task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  name text NOT NULL,
  task_type text NOT NULL,
  default_config jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_tasks_company_id ON tasks(company_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_statutory ON tasks(is_statutory, statutory_type);
CREATE INDEX idx_tasks_board_column ON tasks(board_column);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

CREATE INDEX idx_task_checklist_items_task_id ON task_checklist_items(task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_templates_company_id ON task_templates(company_id);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Tasks RLS Policies (Fixed: Uses correct users table reference)
CREATE POLICY "Users can view tasks from their company"
  ON tasks FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create tasks for their company"
  ON tasks FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update tasks from their company"
  ON tasks FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks from their company"
  ON tasks FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Task Checklist Items RLS Policies (Fixed: Uses correct users table reference)
CREATE POLICY "Users can view checklist items for tasks in their company"
  ON task_checklist_items FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage checklist items for tasks in their company"
  ON task_checklist_items FOR ALL
  USING (task_id IN (
    SELECT id FROM tasks WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Task Comments RLS Policies (Fixed: Uses correct users table reference)
CREATE POLICY "Users can view comments for tasks in their company"
  ON task_comments FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage comments for tasks in their company"
  ON task_comments FOR ALL
  USING (task_id IN (
    SELECT id FROM tasks WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Task Templates RLS Policies (Fixed: Uses correct users table reference)
CREATE POLICY "Users can view templates from their company"
  ON task_templates FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage templates for their company"
  ON task_templates FOR ALL
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Functions for task management
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- Function to get task statistics for a client
CREATE OR REPLACE FUNCTION get_client_task_stats(p_client_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending', COUNT(*) FILTER (WHERE status != 'completed'),
    'overdue', COUNT(*) FILTER (WHERE status != 'completed' AND due_date < now()),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in-progress'),
    'todo', COUNT(*) FILTER (WHERE status = 'todo')
  ) INTO result
  FROM tasks
  WHERE client_id = p_client_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks with enriched data
CREATE OR REPLACE FUNCTION get_tasks_with_details(p_company_id uuid, p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  client_id uuid,
  client_name text,
  title text,
  description text,
  task_type text,
  priority text,
  status text,
  due_date timestamptz,
  start_date timestamptz,
  completed_at timestamptz,
  recurrence_pattern text,
  recurrence_config jsonb,
  next_occurrence timestamptz,
  parent_task_id uuid,
  assigned_to uuid,
  assigned_by uuid,
  time_estimate integer,
  time_spent integer,
  sla_deadline timestamptz,
  is_statutory boolean,
  statutory_type text,
  board_column text,
  board_order integer,
  tags text[],
  attachments jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid,
  assigned_to_email text,
  assigned_to_role text,
  created_by_email text,
  created_by_role text,
  checklist_count integer,
  comments_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.*,
    u1.email as assigned_to_email,
    u1.role as assigned_to_role,
    u2.email as created_by_email,
    u2.role as created_by_role,
    COALESCE(ci.checklist_count, 0) as checklist_count,
    COALESCE(cm.comments_count, 0) as comments_count
  FROM tasks t
  LEFT JOIN users u1 ON t.assigned_to = u1.id
  LEFT JOIN users u2 ON t.created_by = u2.id
  LEFT JOIN (
    SELECT task_id, COUNT(*) as checklist_count
    FROM task_checklist_items
    GROUP BY task_id
  ) ci ON t.id = ci.task_id
  LEFT JOIN (
    SELECT task_id, COUNT(*) as comments_count
    FROM task_comments
    GROUP BY task_id
  ) cm ON t.id = cm.task_id
  WHERE t.company_id = p_company_id
  ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
