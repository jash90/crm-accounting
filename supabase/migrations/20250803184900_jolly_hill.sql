/*
  # Add is_enabled_for_company flag to modules

  1. New Column
    - `is_enabled_for_company` (boolean, default false)
      - Controls whether module is enabled/active for company users
      - Separate from `is_public_within_company` which only controls visibility in module list

  2. Logic
    - `is_public_within_company` = visible to owner in module list
    - `is_enabled_for_company` = available in navbar and accessible to owner/employees
*/

-- Add the new column
ALTER TABLE modules 
ADD COLUMN is_enabled_for_company BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_modules_enabled ON modules (is_enabled_for_company) WHERE is_enabled_for_company = true;

-- Add comment explaining the column
COMMENT ON COLUMN modules.is_enabled_for_company IS 'Controls whether module is enabled/active for company users (navbar access)';