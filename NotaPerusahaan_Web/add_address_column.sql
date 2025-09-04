-- Add address column to receipts table
-- Jalankan script ini di Supabase SQL Editor

-- Add address column to receipts table
ALTER TABLE receipts ADD COLUMN address TEXT;

-- Update existing records with empty address (optional)
UPDATE receipts SET address = '' WHERE address IS NULL;

-- Make address column NOT NULL with default value
ALTER TABLE receipts ALTER COLUMN address SET NOT NULL;
ALTER TABLE receipts ALTER COLUMN address SET DEFAULT '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'receipts' AND column_name = 'address';

SELECT 'Address column added successfully' as status;
