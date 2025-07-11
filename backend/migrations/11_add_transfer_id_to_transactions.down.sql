-- Drop index first
DROP INDEX IF EXISTS idx_transactions_transfer_id;

-- Drop transfer_id column from transactions table
ALTER TABLE transactions DROP COLUMN IF EXISTS transfer_id; 