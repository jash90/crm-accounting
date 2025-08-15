-- Client History Migration
-- Creates tables for tracking all client interactions and activities

-- Create client_history table
CREATE TABLE IF NOT EXISTS client_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Activity details
  activity_type varchar(50) NOT NULL, -- 'created', 'updated', 'viewed', 'contacted', 'document_added', 'invoice_generated', etc.
  activity_title varchar(255) NOT NULL,
  activity_description text,
  
  -- Data changes (for update activities)
  old_data jsonb,
  new_data jsonb,
  changed_fields text[], -- Array of field names that changed
  
  -- Additional metadata
  ip_address inet,
  user_agent text,
  source varchar(50) DEFAULT 'web', -- 'web', 'api', 'mobile', 'system'
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Indexes for better performance
  CONSTRAINT client_history_activity_type_check CHECK (
    activity_type IN (
      'created', 'updated', 'deleted', 'viewed', 'contacted',
      'email_sent', 'phone_call', 'meeting_scheduled', 'meeting_completed',
      'document_uploaded', 'document_downloaded', 'document_deleted',
      'invoice_generated', 'invoice_sent', 'payment_received',
      'contract_signed', 'contract_updated', 'contract_expired',
      'note_added', 'note_updated', 'note_deleted',
      'status_changed', 'assigned', 'unassigned',
      'exported', 'imported', 'merged', 'archived', 'restored',
      'system_update', 'bulk_operation', 'other'
    )
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_client_history_client_id ON client_history(client_id);
CREATE INDEX idx_client_history_company_id ON client_history(company_id);
CREATE INDEX idx_client_history_user_id ON client_history(user_id);
CREATE INDEX idx_client_history_activity_type ON client_history(activity_type);
CREATE INDEX idx_client_history_created_at ON client_history(created_at DESC);
CREATE INDEX idx_client_history_client_created ON client_history(client_id, created_at DESC);

-- Enable RLS
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can view client history" ON client_history
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert client history" ON client_history
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Only allow updates to own records (for corrections within short time)
CREATE POLICY "Users can update own recent client history" ON client_history
  FOR UPDATE USING (
    user_id = auth.uid() 
    AND created_at > (now() - interval '1 hour')
    AND company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Only superadmins and owners can delete history
CREATE POLICY "Owners can delete client history" ON client_history
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('SUPERADMIN', 'OWNER')
    )
  );

-- Create function to automatically log client activities
CREATE OR REPLACE FUNCTION log_client_activity(
  p_client_id uuid,
  p_activity_type varchar(50),
  p_activity_title varchar(255),
  p_activity_description text DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_changed_fields text[] DEFAULT NULL,
  p_source varchar(50) DEFAULT 'web'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
  v_user_id uuid;
  v_history_id uuid;
BEGIN
  -- Get the current user and company
  SELECT id INTO v_user_id FROM auth.users WHERE id = auth.uid();
  
  -- Get company_id from client
  SELECT company_id INTO v_company_id 
  FROM clients 
  WHERE id = p_client_id;
  
  -- Verify user has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = v_user_id 
    AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Access denied to client history';
  END IF;
  
  -- Insert the history record
  INSERT INTO client_history (
    client_id,
    company_id,
    user_id,
    activity_type,
    activity_title,
    activity_description,
    old_data,
    new_data,
    changed_fields,
    source
  ) VALUES (
    p_client_id,
    v_company_id,
    v_user_id,
    p_activity_type,
    p_activity_title,
    p_activity_description,
    p_old_data,
    p_new_data,
    p_changed_fields,
    p_source
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;

-- Create function to get client activity summary
CREATE OR REPLACE FUNCTION get_client_activity_summary(p_client_id uuid)
RETURNS TABLE (
  total_activities bigint,
  last_activity_date timestamptz,
  most_common_activity varchar(50),
  unique_users_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_activities,
    MAX(created_at) as last_activity_date,
    MODE() WITHIN GROUP (ORDER BY activity_type) as most_common_activity,
    COUNT(DISTINCT user_id) as unique_users_count
  FROM client_history 
  WHERE client_id = p_client_id
    AND company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    );
END;
$$;

-- Create trigger to automatically log client updates
CREATE OR REPLACE FUNCTION trigger_log_client_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_changed_fields text[];
  v_field_name text;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Build array of changed fields
  v_changed_fields := ARRAY[]::text[];
  
  -- Convert records to jsonb for comparison
  v_old_data := to_jsonb(OLD);
  v_new_data := to_jsonb(NEW);
  
  -- Check each field for changes (excluding system fields)
  FOR v_field_name IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
  LOOP
    IF (v_old_data ->> v_field_name) IS DISTINCT FROM (v_new_data ->> v_field_name) THEN
      v_changed_fields := array_append(v_changed_fields, v_field_name);
    END IF;
  END LOOP;
  
  -- Only log if there were actual changes
  IF array_length(v_changed_fields, 1) > 0 THEN
    PERFORM log_client_activity(
      NEW.id,
      'updated',
      'Client information updated',
      'Updated fields: ' || array_to_string(v_changed_fields, ', '),
      v_old_data,
      v_new_data,
      v_changed_fields,
      'web'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for client updates
DROP TRIGGER IF EXISTS client_update_history_trigger ON clients;
CREATE TRIGGER client_update_history_trigger
  AFTER UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_client_update();

-- Create trigger to log client creation
CREATE OR REPLACE FUNCTION trigger_log_client_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM log_client_activity(
    NEW.id,
    'created',
    'Client created',
    'New client "' || NEW.company_name || '" was added to the system',
    NULL,
    to_jsonb(NEW),
    NULL,
    'web'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for client creation
DROP TRIGGER IF EXISTS client_creation_history_trigger ON clients;
CREATE TRIGGER client_creation_history_trigger
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_client_creation();

-- Create trigger to log client deletion
CREATE OR REPLACE FUNCTION trigger_log_client_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM log_client_activity(
    OLD.id,
    'deleted',
    'Client deleted',
    'Client "' || OLD.company_name || '" was removed from the system',
    to_jsonb(OLD),
    NULL,
    NULL,
    'web'
  );
  
  RETURN OLD;
END;
$$;

-- Create trigger for client deletion
DROP TRIGGER IF EXISTS client_deletion_history_trigger ON clients;
CREATE TRIGGER client_deletion_history_trigger
  BEFORE DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_client_deletion();
