/*
  # Update activity logs to support client operations

  1. Updates
    - Add 'client' to activity_logs resource_type constraint
    - Enable activity logging for client operations (created, updated, deleted)

  2. Security  
    - Maintains existing RLS policies
    - Company isolation preserved
*/

-- Update the constraint to include 'client' as a valid resource type
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_resource_type_check;

ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_resource_type_check 
  CHECK ((resource_type = ANY (ARRAY['module'::text, 'contact'::text, 'invite'::text, 'client'::text])));