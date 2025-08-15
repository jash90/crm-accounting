/*
  # Create offers system

  1. New Tables
    - `price_list_items` - Product/service catalog with pricing
    - `offers` - Generated offers with status tracking
    - `offer_items` - Line items within offers
    - `checklists` - Post-acceptance task lists for clients

  2. Types
    - `offer_status` enum for offer lifecycle

  3. Functions
    - `create_first_checklist()` for automatic task creation

  4. Security
    - RLS policies for tenant isolation
    - Token-based access for public offer acceptance
*/

-- Price list items
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Offer status enum
DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  net_total numeric(12,2) NOT NULL CHECK (net_total >= 0),
  status public.offer_status DEFAULT 'DRAFT',
  accepted_at timestamptz,
  token text UNIQUE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Offer items (line items)
CREATE TABLE IF NOT EXISTS public.offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE NOT NULL,
  price_list_item_id uuid REFERENCES price_list_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  qty integer NOT NULL CHECK (qty > 0),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  line_total numeric(12,2) GENERATED ALWAYS AS (qty * price) STORED
);

-- Checklists for post-acceptance tasks
CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_list_items_company_id ON price_list_items(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_client_id ON offers(client_id);
CREATE INDEX IF NOT EXISTS idx_offers_company_id ON offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_token ON offers(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_checklists_client_id ON checklists(client_id);
CREATE INDEX IF NOT EXISTS idx_checklists_company_id ON checklists(company_id);

-- Function to create default checklist items
CREATE OR REPLACE FUNCTION create_first_checklist(client_uuid uuid)
RETURNS void AS $$
DECLARE
  client_company_id uuid;
  owner_user_id uuid;
BEGIN
  -- Get client's company_id
  SELECT company_id INTO client_company_id FROM clients WHERE id = client_uuid;
  
  IF client_company_id IS NULL THEN
    RAISE EXCEPTION 'Client not found or has no company';
  END IF;
  
  -- Get a company owner to attribute checklist creation
  SELECT id INTO owner_user_id 
  FROM users 
  WHERE company_id = client_company_id 
    AND role IN ('OWNER', 'SUPERADMIN') 
  LIMIT 1;
  
  -- Insert default checklist items
  INSERT INTO checklists (client_id, title, description, company_id, created_by) VALUES
    (client_uuid, 'Collect documents', 'Gather all required client documentation and contracts', client_company_id, owner_user_id),
    (client_uuid, 'Schedule kick-off call', 'Set up initial project kick-off meeting with client', client_company_id, owner_user_id),
    (client_uuid, 'Set up shared drive', 'Create shared folder structure and grant client access', client_company_id, owner_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Price list items
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage price list items" ON price_list_items
  FOR ALL TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read offers" ON offers
  FOR SELECT TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Company members can create offers" ON offers
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Company members can update offers" ON offers
  FOR UPDATE TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Public access for offer acceptance via token
CREATE POLICY "Public can read offers by token" ON offers
  FOR SELECT TO anon
  USING (token IS NOT NULL AND status = 'SENT');

CREATE POLICY "Public can update offers by token" ON offers
  FOR UPDATE TO anon
  USING (token IS NOT NULL AND status = 'SENT')
  WITH CHECK (status = 'ACCEPTED');

-- Offer items
ALTER TABLE offer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage offer items" ON offer_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.id = offer_items.offer_id 
        AND offers.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

CREATE POLICY "Public can read offer items by offer token" ON offer_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.id = offer_items.offer_id 
        AND offers.token IS NOT NULL 
        AND offers.status = 'SENT'
    )
  );

-- Checklists
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage checklists" ON checklists
  FOR ALL TO authenticated
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN')
  )
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );