/*
# Create Contacts Module

1. New Module
   - `contacts_module` - Global contacts module managed by super admin

2. Purpose
   - Makes contacts functionality a module rather than default feature
   - Super admin controls which companies can access contacts
   - Owners control which employees can access contacts within company
*/

-- Create the Contacts module as a global module
INSERT INTO modules (id, name, description, company_id, created_by, is_public_within_company, created_at)
VALUES (
  gen_random_uuid(),
  'Contacts',
  'Manage contractor and contact directory with skills, availability, and rates tracking',
  NULL, -- Global module (available to all companies when assigned)
  (SELECT id FROM users WHERE role = 'SUPERADMIN' LIMIT 1),
  false, -- Not automatically public - requires assignment
  now()
);