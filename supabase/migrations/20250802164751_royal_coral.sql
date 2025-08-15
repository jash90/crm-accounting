/*
  # Update Contacts Module System

  1. Changes
    - Remove global Contacts module 
    - Create company-specific Contacts modules for existing companies
    - Update module visibility system

  2. Security
    - Only Super Admins can create modules for companies
    - Owners control module visibility within their company
*/

-- Remove the global Contacts module if it exists
DELETE FROM modules WHERE name = 'Contacts' AND company_id IS NULL;

-- Create Contacts module for each existing company
INSERT INTO modules (name, description, company_id, created_by, is_public_within_company)
SELECT 
  'Contacts',
  'Manage contractor and contact directory',
  c.id,
  c.owner_id,
  true  -- Make it public by default
FROM companies c
WHERE c.owner_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM modules m 
  WHERE m.name = 'Contacts' 
  AND m.company_id = c.id
);