-- Migration: Fix tasks created_by field for existing tasks
-- Description: Update existing tasks that may be missing created_by information
-- Date: 2025-01-17

-- Update tasks with null created_by to use the company owner
-- This is a safe fallback for existing tasks without creator information
UPDATE tasks 
SET created_by = (
  SELECT id 
  FROM users 
  WHERE users.company_id = tasks.company_id 
    AND users.role = 'OWNER' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- For tasks where no owner is found, use the oldest employee in the company
UPDATE tasks 
SET created_by = (
  SELECT id 
  FROM users 
  WHERE users.company_id = tasks.company_id 
  ORDER BY users.created_at ASC 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Add a comment to track this migration
COMMENT ON COLUMN tasks.created_by IS 'User who created the task. Updated 2025-01-17 for existing records.';

-- Verify the update
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM tasks WHERE created_by IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Migration incomplete: % tasks still have NULL created_by', null_count;
    ELSE
        RAISE NOTICE 'Migration successful: All tasks now have created_by assigned';
    END IF;
END $$;