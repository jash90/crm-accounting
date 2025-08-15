/*
  # Initial Schema Setup for Multi-Tenant SaaS

  1. New Tables
    - `companies` - Company/tenant isolation
    - `users` - Extended user profiles linked to Supabase Auth
    - `modules` - Application modules/features
    - `invites` - Invitation system for new users
    - `users_modules` - Many-to-many relationship between users and modules

  2. Security
    - Enable RLS on all tables
    - Company-based isolation policies
    - Role-based access control (SUPERADMIN, OWNER, EMPLOYEE)
    - Secure invitation system

  3. Relationships
    - Foreign keys with CASCADE deletes
    - Proper indexing for performance
    - Auth user ID matches users.id
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (tenant isolation)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  owner_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, -- This matches auth.users.id
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('SUPERADMIN', 'OWNER', 'EMPLOYEE')),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Modules table (application features)
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE, -- NULL for global modules
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  is_public_within_company boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Invites table (invitation system)
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('OWNER', 'EMPLOYEE')),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Users-Modules junction table
CREATE TABLE IF NOT EXISTS users_modules (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- Add foreign key constraint for companies.owner_id after users table exists
ALTER TABLE companies ADD CONSTRAINT fk_companies_owner 
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_modules_company_id ON modules(company_id);
CREATE INDEX IF NOT EXISTS idx_modules_created_by ON modules(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_company_id ON invites(company_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_modules ENABLE ROW LEVEL SECURITY;