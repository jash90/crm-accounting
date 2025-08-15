/*
  # Row Level Security Policies

  1. Companies Policies
    - Owners can manage their company
    - Superadmins can access all companies
    - Employees can read their company info

  2. Users Policies
    - Users can read their own data
    - Company members can see other company members
    - Superadmins can access all users

  3. Modules Policies
    - Company-scoped module access
    - Public modules visible to company members
    - Superadmins have global access

  4. Invites Policies
    - Owners can manage invites for their company
    - Invited users can read their own invites

  5. Users-Modules Policies
    - Users can see their granted modules
    - Owners can manage module assignments
*/

-- Companies RLS Policies
CREATE POLICY "Users can read their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Owners can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Superadmins can insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Owners and superadmins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Users RLS Policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
  );

CREATE POLICY "Company members can read other company members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "System can insert users during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

-- Modules RLS Policies
CREATE POLICY "Users can read company modules"
  ON modules
  FOR SELECT
  TO authenticated
  USING (
    -- Global modules (no company_id)
    company_id IS NULL
    -- Company-specific modules
    OR company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    -- Public modules within company
    OR (is_public_within_company = true AND company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
    -- Superadmin access
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Owners and superadmins can create modules"
  ON modules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = modules.company_id)
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners and superadmins can update modules"
  ON modules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = modules.company_id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    OR created_by = auth.uid()
  );

CREATE POLICY "Owners and superadmins can delete modules"
  ON modules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = modules.company_id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    OR created_by = auth.uid()
  );

-- Invites RLS Policies
CREATE POLICY "Owners can read company invites"
  ON invites
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'OWNER')
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Anyone can read invites by token (for acceptance)"
  ON invites
  FOR SELECT
  TO anon
  USING (status = 'PENDING' AND expires_at > now());

CREATE POLICY "Owners can create invites"
  ON invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'OWNER')
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Owners can update company invites"
  ON invites
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'OWNER')
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "System can update invites during acceptance"
  ON invites
  FOR UPDATE
  TO anon
  USING (status = 'PENDING' AND expires_at > now());

-- Users-Modules RLS Policies
CREATE POLICY "Users can read their module assignments"
  ON users_modules
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' 
               AND company_id = (SELECT company_id FROM users WHERE id = users_modules.user_id))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Owners can manage module assignments"
  ON users_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' 
            AND company_id = (SELECT company_id FROM users WHERE id = users_modules.user_id))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' 
            AND company_id = (SELECT company_id FROM users WHERE id = users_modules.user_id))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );