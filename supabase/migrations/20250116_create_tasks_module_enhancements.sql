-- Tasks Module Database Schema Enhancements
-- Migration: 20250116_create_tasks_module_enhancements.sql
-- Enhancements to existing schema for better functionality and performance

-- 1. Add missing constraints and validation
ALTER TABLE tasks 
ADD CONSTRAINT check_task_type_not_null 
CHECK (task_type IS NOT NULL);

ALTER TABLE tasks 
ADD CONSTRAINT check_priority_not_null 
CHECK (priority IS NOT NULL);

ALTER TABLE tasks 
ADD CONSTRAINT check_board_column_not_null 
CHECK (board_column IS NOT NULL);

-- Enhanced board column validation with more realistic columns
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_board_column_check;

ALTER TABLE tasks 
ADD CONSTRAINT check_board_column_valid 
CHECK (board_column IN ('backlog', 'todo', 'in-progress', 'review', 'completed', 'cancelled'));

-- 2. Add statutory type validation for Polish accounting
ALTER TABLE tasks 
ADD CONSTRAINT check_statutory_type_valid 
CHECK (
  statutory_type IS NULL OR 
  statutory_type IN ('VAT-7', 'CIT-8', 'PIT-4', 'ZUS', 'JPK', 'CEIDG', 'CUSTOMS', 'OTHER')
);

-- 3. Logical constraints
ALTER TABLE tasks 
ADD CONSTRAINT check_time_estimate_positive 
CHECK (time_estimate IS NULL OR time_estimate > 0);

ALTER TABLE tasks 
ADD CONSTRAINT check_time_spent_non_negative 
CHECK (time_spent >= 0);

ALTER TABLE tasks 
ADD CONSTRAINT check_board_order_non_negative 
CHECK (board_order >= 0);

-- 4. Date logic constraints
ALTER TABLE tasks 
ADD CONSTRAINT check_start_before_due 
CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);

ALTER TABLE tasks 
ADD CONSTRAINT check_completed_at_logic 
CHECK (
  (status = 'completed' AND completed_at IS NOT NULL) OR 
  (status != 'completed' AND completed_at IS NULL)
);

-- 5. Statutory task logic
ALTER TABLE tasks 
ADD CONSTRAINT check_statutory_consistency 
CHECK (
  (is_statutory = true AND statutory_type IS NOT NULL) OR 
  (is_statutory = false AND statutory_type IS NULL)
);

-- 6. Recurring task logic
ALTER TABLE tasks 
ADD CONSTRAINT check_recurring_logic 
CHECK (
  (task_type = 'recurring' AND recurrence_pattern IS NOT NULL) OR 
  (task_type != 'recurring' AND recurrence_pattern IS NULL)
);

-- 7. Add missing indexes for better performance
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_recurring ON tasks(task_type, recurrence_pattern) WHERE task_type = 'recurring';
CREATE INDEX idx_tasks_next_occurrence ON tasks(next_occurrence) WHERE next_occurrence IS NOT NULL;
CREATE INDEX idx_tasks_board_order ON tasks(board_column, board_order);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Composite index for common dashboard queries
CREATE INDEX idx_tasks_company_status_due ON tasks(company_id, status, due_date);

-- Index for overdue tasks query
CREATE INDEX idx_tasks_overdue ON tasks(company_id, status, due_date) 
WHERE status NOT IN ('completed', 'cancelled') AND due_date IS NOT NULL;

-- 8. Enhanced function for task dashboard statistics
CREATE OR REPLACE FUNCTION get_company_task_stats(p_company_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in-progress'),
    'todo', COUNT(*) FILTER (WHERE status = 'todo'),
    'review', COUNT(*) FILTER (WHERE status = 'review'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'overdue', COUNT(*) FILTER (
      WHERE status NOT IN ('completed', 'cancelled') 
      AND due_date < now()
    ),
    'due_today', COUNT(*) FILTER (
      WHERE status NOT IN ('completed', 'cancelled') 
      AND due_date::date = CURRENT_DATE
    ),
    'due_this_week', COUNT(*) FILTER (
      WHERE status NOT IN ('completed', 'cancelled') 
      AND due_date BETWEEN now() AND (now() + interval '7 days')
    ),
    'statutory', COUNT(*) FILTER (WHERE is_statutory = true),
    'statutory_overdue', COUNT(*) FILTER (
      WHERE is_statutory = true 
      AND status NOT IN ('completed', 'cancelled') 
      AND due_date < now()
    ),
    'high_priority', COUNT(*) FILTER (
      WHERE priority = 'urgent' 
      AND status NOT IN ('completed', 'cancelled')
    ),
    'total_time_estimated', COALESCE(SUM(time_estimate), 0),
    'total_time_spent', COALESCE(SUM(time_spent), 0)
  ) INTO result
  FROM tasks
  WHERE company_id = p_company_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to create recurring task instances
CREATE OR REPLACE FUNCTION create_recurring_task_instance(p_parent_task_id uuid)
RETURNS uuid AS $$
DECLARE
  parent_task tasks%ROWTYPE;
  new_task_id uuid;
  next_due_date timestamptz;
BEGIN
  -- Get parent task details
  SELECT * INTO parent_task 
  FROM tasks 
  WHERE id = p_parent_task_id AND task_type = 'recurring';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent task not found or not recurring';
  END IF;
  
  -- Calculate next due date based on recurrence pattern
  CASE parent_task.recurrence_pattern
    WHEN 'daily' THEN
      next_due_date := parent_task.due_date + interval '1 day';
    WHEN 'weekly' THEN
      next_due_date := parent_task.due_date + interval '1 week';
    WHEN 'monthly' THEN
      next_due_date := parent_task.due_date + interval '1 month';
    WHEN 'quarterly' THEN
      next_due_date := parent_task.due_date + interval '3 months';
    WHEN 'yearly' THEN
      next_due_date := parent_task.due_date + interval '1 year';
    ELSE
      -- Custom recurrence - use recurrence_config
      next_due_date := parent_task.next_occurrence;
  END CASE;
  
  -- Create new task instance
  INSERT INTO tasks (
    company_id, client_id, client_name, title, description,
    task_type, priority, status, due_date, start_date,
    recurrence_pattern, recurrence_config, parent_task_id,
    assigned_to, assigned_by, time_estimate, sla_deadline,
    is_statutory, statutory_type, board_column, tags,
    created_by
  ) VALUES (
    parent_task.company_id, parent_task.client_id, parent_task.client_name,
    parent_task.title, parent_task.description, 'one-time', -- Instance is one-time
    parent_task.priority, 'todo', next_due_date, 
    next_due_date - (parent_task.due_date - parent_task.start_date), -- Maintain duration
    NULL, NULL, p_parent_task_id, -- Clear recurrence for instance
    parent_task.assigned_to, parent_task.assigned_by, parent_task.time_estimate,
    next_due_date + (parent_task.sla_deadline - parent_task.due_date), -- Maintain SLA offset
    parent_task.is_statutory, parent_task.statutory_type, parent_task.board_column,
    parent_task.tags, parent_task.created_by
  ) RETURNING id INTO new_task_id;
  
  -- Update parent task's next occurrence
  UPDATE tasks 
  SET next_occurrence = next_due_date + 
    CASE recurrence_pattern
      WHEN 'daily' THEN interval '1 day'
      WHEN 'weekly' THEN interval '1 week'
      WHEN 'monthly' THEN interval '1 month'
      WHEN 'quarterly' THEN interval '3 months'
      WHEN 'yearly' THEN interval '1 year'
      ELSE interval '1 month' -- Default fallback
    END
  WHERE id = p_parent_task_id;
  
  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function for efficient task search
CREATE OR REPLACE FUNCTION search_tasks(
  p_company_id uuid,
  p_search_term text,
  p_status_filter text[] DEFAULT NULL,
  p_priority_filter text[] DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_is_statutory boolean DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  due_date timestamptz,
  client_name text,
  assigned_to_email text,
  is_statutory boolean,
  statutory_type text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.client_name,
    u.email as assigned_to_email,
    t.is_statutory,
    t.statutory_type,
    t.created_at
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  WHERE t.company_id = p_company_id
    AND (p_search_term IS NULL OR (
      t.title ILIKE '%' || p_search_term || '%' OR
      t.description ILIKE '%' || p_search_term || '%' OR
      t.client_name ILIKE '%' || p_search_term || '%'
    ))
    AND (p_status_filter IS NULL OR t.status = ANY(p_status_filter))
    AND (p_priority_filter IS NULL OR t.priority = ANY(p_priority_filter))
    AND (p_client_id IS NULL OR t.client_id = p_client_id)
    AND (p_assigned_to IS NULL OR t.assigned_to = p_assigned_to)
    AND (p_is_statutory IS NULL OR t.is_statutory = p_is_statutory)
  ORDER BY 
    CASE WHEN t.status NOT IN ('completed', 'cancelled') AND t.due_date < now() THEN 0 ELSE 1 END, -- Overdue first
    t.due_date ASC NULLS LAST,
    t.priority DESC,
    t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Add task activity tracking table for integration with activity logs
CREATE TABLE task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) NOT NULL,
  action_type text NOT NULL, -- 'created', 'updated', 'assigned', 'completed', 'commented'
  old_values jsonb,
  new_values jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS for task activities
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task activities for their company tasks"
  ON task_activities FOR SELECT
  USING (task_id IN (
    SELECT id FROM tasks WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create task activities for their company tasks"
  ON task_activities FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM tasks WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Index for task activities
CREATE INDEX idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX idx_task_activities_created_at ON task_activities(created_at);

-- 12. Triggers for automatic activity logging
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_activities (task_id, user_id, action_type, new_values, description)
    VALUES (NEW.id, NEW.created_by, 'created', row_to_json(NEW), 'Task created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if meaningful fields changed
    IF OLD.status != NEW.status OR 
       OLD.assigned_to != NEW.assigned_to OR 
       OLD.priority != NEW.priority OR
       OLD.due_date != NEW.due_date THEN
      INSERT INTO task_activities (task_id, user_id, action_type, old_values, new_values, description)
      VALUES (NEW.id, auth.uid(), 'updated', 
              jsonb_build_object(
                'status', OLD.status,
                'assigned_to', OLD.assigned_to,
                'priority', OLD.priority,
                'due_date', OLD.due_date
              ),
              jsonb_build_object(
                'status', NEW.status,
                'assigned_to', NEW.assigned_to,
                'priority', NEW.priority,
                'due_date', NEW.due_date
              ),
              'Task updated');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO task_activities (task_id, user_id, action_type, old_values, description)
    VALUES (OLD.id, auth.uid(), 'deleted', row_to_json(OLD), 'Task deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_log_task_activity
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_activity();

-- 13. Add view for task dashboard
CREATE VIEW task_dashboard AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  t.client_name,
  t.is_statutory,
  t.statutory_type,
  u.email as assigned_to_email,
  CASE 
    WHEN t.status NOT IN ('completed', 'cancelled') AND t.due_date < now() THEN 'overdue'
    WHEN t.status NOT IN ('completed', 'cancelled') AND t.due_date::date = CURRENT_DATE THEN 'due_today'
    WHEN t.status NOT IN ('completed', 'cancelled') AND t.due_date BETWEEN now() AND (now() + interval '7 days') THEN 'due_soon'
    ELSE 'normal'
  END as urgency_status,
  EXTRACT(DAYS FROM (now() - t.due_date)) as days_overdue
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status NOT IN ('completed', 'cancelled');

-- Grant permissions for new objects
GRANT SELECT ON task_dashboard TO authenticated;
GRANT ALL ON task_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_task_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_task_instance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_tasks(uuid, text, text[], text[], uuid, uuid, boolean, integer, integer) TO authenticated;