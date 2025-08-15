/*
  # Add href column to modules table

  1. Changes
    - Add `href` column to modules table to store module links
    - Column is optional (nullable) and stores URL as text
    - Add index for better query performance

  2. Security
    - No RLS changes needed, inherits existing policies
*/

-- Add href column to modules table
ALTER TABLE modules ADD COLUMN href TEXT;

-- Add index for href column for better performance
CREATE INDEX IF NOT EXISTS idx_modules_href ON modules(href) WHERE href IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN modules.href IS 'Optional URL link to the module resource';