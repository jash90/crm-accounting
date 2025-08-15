/*
  # Create clients table for accounting/bookkeeping client management

  1. New Tables
    - `clients`
      - Basic client information (company name, start date, business type)
      - Tax and VAT details (tax form, VAT status, GTU codes)
      - Social security information (ZUS details, employment relief)
      - Contact information and service status
      - AML classification and service agreements
      - Additional costs, assets, and notes

  2. Security
    - Enable RLS on `clients` table
    - Add policies for company-based access control

  3. Indexes
    - Add indexes for frequently queried columns
    - Add unique constraint for company-specific client numbering
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number integer NOT NULL,
  
  -- Basic Information
  company_name text NOT NULL,
  start_date date,
  end_date date, -- for suspended/closed businesses
  business_type text, -- specyfika firmy
  
  -- Business Structure
  employment_form text, -- zatrudnienie (DG, etc.)
  
  -- Social Security (ZUS)
  zus_details text, -- ZUS contribution details
  zus_startup_relief boolean DEFAULT false, -- ulga na start
  zus_startup_relief_months integer DEFAULT 0,
  
  -- Taxation
  tax_form text, -- forma opodatkowania
  vat_status text, -- VAT status
  vat_frequency text, -- monthly/quarterly
  gtu_codes text[], -- GTU codes array
  vat_eu_registration boolean DEFAULT false, -- VAT-UE zgłoszenie
  labor_fund boolean DEFAULT false, -- Fundusz Pracy
  free_amount_2022 boolean DEFAULT false, -- kwota wolna 2022
  
  -- Costs and Assets
  fixed_costs text[], -- stałe koszty
  vehicles_assets text, -- samochód/inne
  depreciation_info text, -- amortyzacja
  
  -- Systems and Tools
  e_szok_system boolean DEFAULT false, -- e-SZOK usage
  has_employees boolean DEFAULT false, -- pracownicy
  
  -- Contact Information
  phone text,
  email text,
  
  -- Database and Compliance
  database_status text DEFAULT 'Not Created', -- baza danych
  aml_group text, -- AML group
  aml_date date, -- AML assignment date
  
  -- Service Management
  service_provider text, -- obsługa
  contract_status text DEFAULT 'Not Signed', -- umowy
  
  -- Contract Annexes
  annexes_2022_status text, -- aneksy 2022
  annexes_2022_sent_date date,
  annexes_2023_status text, -- aneksy 2023
  annexes_2023_sent_date date,
  
  -- Additional Information
  additional_notes text, -- info dodatkowe
  
  -- System fields
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for client numbering within company
ALTER TABLE clients ADD CONSTRAINT unique_client_number_per_company 
  UNIQUE (company_id, client_number);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_tax_form ON clients(tax_form);
CREATE INDEX IF NOT EXISTS idx_clients_vat_status ON clients(vat_status);
CREATE INDEX IF NOT EXISTS idx_clients_contract_status ON clients(contract_status);
CREATE INDEX IF NOT EXISTS idx_clients_aml_group ON clients(aml_group);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company members can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
  );

CREATE POLICY "Owners and creators can create clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('OWNER', 'SUPERADMIN')
        AND company_id = clients.company_id
      )
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'SUPERADMIN'
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners and creators can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('OWNER', 'SUPERADMIN')
      AND company_id = clients.company_id
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Owners and creators can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('OWNER', 'SUPERADMIN')
      AND company_id = clients.company_id
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
    OR created_by = auth.uid()
  );

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get next client number for company
CREATE OR REPLACE FUNCTION get_next_client_number(company_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
BEGIN
  SELECT COALESCE(MAX(client_number), 0) + 1
  INTO next_number
  FROM clients
  WHERE company_id = company_uuid;
  
  RETURN next_number;
END;
$$;