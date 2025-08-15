/*
  # Add Contacts Module for Contractor Management

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `name` (text, required) - Full name of the contractor
      - `email` (text, unique) - Contact email
      - `phone` (text, optional) - Phone number
      - `company` (text, optional) - Contractor's company name
      - `title` (text, optional) - Job title/role
      - `skills` (text array, optional) - Array of skills/technologies
      - `hourly_rate` (numeric, optional) - Hourly rate
      - `availability` (text, optional) - Availability status
      - `notes` (text, optional) - Additional notes
      - `company_id` (uuid, required) - Links to companies table
      - `created_by` (uuid, required) - User who created the contact
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `contacts` table
    - Add policies for company-based access control
    - Only company members can access their contacts
    - Owners can manage all company contacts
    - Employees can view contacts (based on permissions)

  3. Indexes
    - Index on company_id for fast company-based queries
    - Index on email for search functionality
    - Index on skills for filtering
*/

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  title text,
  skills text[],
  hourly_rate numeric(10,2),
  availability text DEFAULT 'Available' CHECK (availability IN ('Available', 'Busy', 'Unavailable')),
  notes text,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_skills ON contacts USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_contacts_availability ON contacts(availability);

-- Create unique constraint on email per company (allow same email across different companies)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email_company ON contacts(email, company_id) WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Company members can read contacts from their company
CREATE POLICY "Company members can read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Owners and superadmins can create contacts
CREATE POLICY "Owners can create contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = contacts.company_id)
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    )
    AND created_by = auth.uid()
  );

-- Owners and superadmins can update contacts
CREATE POLICY "Owners can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = contacts.company_id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    OR created_by = auth.uid()
  );

-- Owners and superadmins can delete contacts
CREATE POLICY "Owners can delete contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'OWNER' AND company_id = contacts.company_id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
    OR created_by = auth.uid()
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();