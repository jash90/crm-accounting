/*
  # Drop Contacts and Offers Tables
  
  This migration removes all tables related to the contacts and offers modules.
  Tables are dropped in the correct order to respect foreign key constraints.
  All operations are wrapped in DO blocks to handle cases where objects might not exist.
*/

-- First, handle all policies and triggers in a safe block
DO $$
BEGIN
  -- Drop policies only if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read contacts" ON contacts;
    DROP POLICY IF EXISTS "Company members can manage contacts" ON contacts;
    DROP POLICY IF EXISTS "Owners can create contacts" ON contacts;
    DROP POLICY IF EXISTS "Owners can update contacts" ON contacts;
    DROP POLICY IF EXISTS "Owners can delete contacts" ON contacts;
    DROP POLICY IF EXISTS "Authorized users can create contacts" ON contacts;
    DROP POLICY IF EXISTS "Authorized users can update contacts" ON contacts;
    DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_list_items' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can manage price list items" ON price_list_items;
    DROP POLICY IF EXISTS "Company members can read price list items" ON price_list_items;
    DROP POLICY IF EXISTS "Authorized users can manage price list items" ON price_list_items;
    DROP TRIGGER IF EXISTS update_price_list_items_updated_at ON price_list_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_list_categories' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read price list categories" ON price_list_categories;
    DROP POLICY IF EXISTS "Authorized users can manage price list categories" ON price_list_categories;
    DROP TRIGGER IF EXISTS update_price_list_categories_updated_at ON price_list_categories;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read offers" ON offers;
    DROP POLICY IF EXISTS "Company members can create offers" ON offers;
    DROP POLICY IF EXISTS "Company members can update offers" ON offers;
    DROP POLICY IF EXISTS "Public can read offers by token" ON offers;
    DROP POLICY IF EXISTS "Public can update offers by token" ON offers;
    DROP POLICY IF EXISTS "Authorized users can create offers" ON offers;
    DROP POLICY IF EXISTS "Authorized users can update offers" ON offers;
    DROP POLICY IF EXISTS "Public can accept/reject offers by token" ON offers;
    DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
    DROP TRIGGER IF EXISTS log_offer_activity_trigger ON offers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_items' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can manage offer items" ON offer_items;
    DROP POLICY IF EXISTS "Public can read offer items by token" ON offer_items;
    DROP TRIGGER IF EXISTS update_offer_items_updated_at ON offer_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_templates' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read templates" ON offer_templates;
    DROP POLICY IF EXISTS "Owners can manage templates" ON offer_templates;
    DROP TRIGGER IF EXISTS update_offer_templates_updated_at ON offer_templates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklists' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can manage checklists" ON checklists;
    DROP TRIGGER IF EXISTS update_checklists_updated_at ON checklists;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_templates' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read checklist templates" ON checklist_templates;
    DROP POLICY IF EXISTS "Owners can manage checklist templates" ON checklist_templates;
    DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON checklist_templates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_activities' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can read offer activities" ON offer_activities;
    DROP POLICY IF EXISTS "System can create offer activities" ON offer_activities;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_documents' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can manage offer documents" ON offer_documents;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_email_templates' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Company members can manage email templates" ON offer_email_templates;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies/triggers: %', SQLERRM;
END $$;

-- Drop all functions related to these modules (wrapped in DO block for safety)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_default_checklist_items(uuid, uuid);
  DROP FUNCTION IF EXISTS generate_offer_number(uuid);
  DROP FUNCTION IF EXISTS log_offer_activity();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping functions: %', SQLERRM;
END $$;

-- Drop all indexes (wrapped in DO block for safety)
DO $$
BEGIN
  -- Contacts indexes
  DROP INDEX IF EXISTS idx_contacts_company_id;
  DROP INDEX IF EXISTS idx_contacts_email;
  DROP INDEX IF EXISTS idx_contacts_skills;
  DROP INDEX IF EXISTS idx_contacts_tags;
  DROP INDEX IF EXISTS idx_contacts_availability;
  DROP INDEX IF EXISTS idx_contacts_is_active;
  DROP INDEX IF EXISTS idx_contacts_contact_type;
  DROP INDEX IF EXISTS idx_contacts_email_company;

  -- Price list indexes
  DROP INDEX IF EXISTS idx_price_list_items_company_id;
  DROP INDEX IF EXISTS idx_price_list_items_category_id;
  DROP INDEX IF EXISTS idx_price_list_items_is_active;
  DROP INDEX IF EXISTS idx_price_list_categories_company_id;
  DROP INDEX IF EXISTS idx_price_list_categories_parent_id;

  -- Offers indexes
  DROP INDEX IF EXISTS idx_offers_client_id;
  DROP INDEX IF EXISTS idx_offers_company_id;
  DROP INDEX IF EXISTS idx_offers_status;
  DROP INDEX IF EXISTS idx_offers_token;
  DROP INDEX IF EXISTS idx_offers_created_by;
  DROP INDEX IF EXISTS idx_offers_valid_until;
  DROP INDEX IF EXISTS idx_offer_items_offer_id;

  -- Checklists indexes
  DROP INDEX IF EXISTS idx_checklists_client_id;
  DROP INDEX IF EXISTS idx_checklists_offer_id;
  DROP INDEX IF EXISTS idx_checklists_company_id;
  DROP INDEX IF EXISTS idx_checklists_is_completed;
  DROP INDEX IF EXISTS idx_checklists_due_date;

  -- Activity and documents indexes
  DROP INDEX IF EXISTS idx_offer_activities_offer_id;
  DROP INDEX IF EXISTS idx_offer_activities_activity_type;
  DROP INDEX IF EXISTS idx_offer_documents_offer_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping indexes: %', SQLERRM;
END $$;

-- Drop tables in correct order (wrapped in DO block for proper execution)
DO $$
BEGIN
  -- Drop offer-related dependent tables first
  DROP TABLE IF EXISTS offer_activities CASCADE;
  DROP TABLE IF EXISTS offer_documents CASCADE;
  DROP TABLE IF EXISTS offer_email_templates CASCADE;
  DROP TABLE IF EXISTS offer_template_items CASCADE;
  DROP TABLE IF EXISTS checklist_template_items CASCADE;
  
  -- Important: Drop offer_items before offers and price_list_items
  DROP TABLE IF EXISTS offer_items CASCADE;
  
  -- Drop main offer tables
  DROP TABLE IF EXISTS offers CASCADE;
  DROP TABLE IF EXISTS offer_templates CASCADE;
  DROP TABLE IF EXISTS checklists CASCADE;
  DROP TABLE IF EXISTS checklist_templates CASCADE;
  DROP TABLE IF EXISTS price_list_items CASCADE;
  DROP TABLE IF EXISTS price_list_categories CASCADE;
  
  -- Drop contacts table
  DROP TABLE IF EXISTS contacts CASCADE;
  
  RAISE NOTICE 'Tables dropped successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping tables: %', SQLERRM;
END $$;

-- Remove any references in the modules table (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules' AND table_schema = 'public') THEN
    DELETE FROM modules WHERE name IN ('Contacts', 'Offers', 'Price List', 'Checklists');
    RAISE NOTICE 'Module references removed';
  END IF;
  
  -- Remove any module assignments if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_assignments' AND table_schema = 'public') THEN
    DELETE FROM module_assignments 
    WHERE module_id IN (
      SELECT id FROM modules 
      WHERE name IN ('Contacts', 'Offers', 'Price List', 'Checklists')
    );
  END IF;
  
  -- Also check for company_modules table (alternative naming)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_modules' AND table_schema = 'public') THEN
    DELETE FROM company_modules 
    WHERE module_id IN (
      SELECT id FROM modules 
      WHERE name IN ('Contacts', 'Offers', 'Price List', 'Checklists')
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error cleaning module references: %', SQLERRM;
END $$;

-- Clean up any orphaned data that might reference these tables
DO $$
BEGIN
  -- Clean up any activity logs related to these modules
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs' AND table_schema = 'public') THEN
    -- Check if the table has the expected columns before trying to delete
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activity_logs' 
               AND column_name = 'resource_type'
               AND table_schema = 'public') THEN
      DELETE FROM activity_logs 
      WHERE resource_type IN ('contact', 'offer', 'checklist', 'price_list_item')
        OR resource_name LIKE '%contact%'
        OR resource_name LIKE '%offer%'
        OR resource_name LIKE '%checklist%'
        OR resource_name LIKE '%price_list%'
        OR action_type LIKE '%contact%'
        OR action_type LIKE '%offer%'
        OR action_type LIKE '%checklist%'
        OR action_type LIKE '%price_list%';
      RAISE NOTICE 'Activity logs cleaned up';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error cleaning activity logs: %', SQLERRM;
END $$;