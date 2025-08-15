/*
  # Add Activity Logs Table

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `company_id` (uuid, foreign key to companies)
      - `action_type` (text) - created, updated, deleted, enabled, disabled
      - `resource_type` (text) - module, contact, etc.
      - `resource_name` (text) - name of the resource
      - `details` (jsonb) - additional context
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for company members to read their company's activity logs
    - Add policy for authenticated users to insert activity logs
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'enabled', 'disabled')),
  resource_type text NOT NULL CHECK (resource_type IN ('module', 'contact', 'invite')),
  resource_name text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Company members can read their company's activity logs
CREATE POLICY "Company members can read activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Authenticated users can insert activity logs
CREATE POLICY "Users can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );