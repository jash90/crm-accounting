/*
  # Authentication Helper Functions

  1. Functions
    - `handle_new_user()` - Trigger function for new auth users
    - `get_user_role()` - Helper to get current user's role
    - `is_company_owner()` - Check if user is company owner

  2. Triggers
    - Auto-create user profile when auth user is created
*/

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Helper function to check if user is company owner
CREATE OR REPLACE FUNCTION is_company_owner(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'OWNER' 
    AND company_id = company_uuid
  );
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Note: User profile creation will be handled by the registration process
  -- This trigger is here for future enhancements
  RETURN NEW;
END;
$$;

-- Trigger for new auth users (placeholder for future use)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;