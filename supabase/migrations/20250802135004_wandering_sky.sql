/*
  # Ensure Contacts Module Exists and is Visible

  1. Global Module
    - Create or update the Contacts module as a global module
    - Ensure it's visible to all companies
  
  2. Proper Setup
    - Set correct permissions for superadmins to assign
    - Make it available for owners to see and assign to employees
*/

-- First, check if Contacts module already exists and delete it if it does
DELETE FROM modules WHERE name = 'Contacts';

-- Create the Contacts module as a global module (company_id = NULL)
INSERT INTO modules (name, description, company_id, created_by, is_public_within_company, created_at)
VALUES (
  'Contacts',
  'Manage contractor and contact directory for your company. Track availability, skills, rates, and contact information.',
  NULL, -- Global module (available to all companies)
  (SELECT id FROM users WHERE role = 'SUPERADMIN' LIMIT 1), -- Created by first superadmin
  true, -- Public within company when assigned
  now()
);