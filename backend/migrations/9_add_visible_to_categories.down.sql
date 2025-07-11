-- Remove the "Transferência" category
DELETE FROM categories WHERE name = 'Transferência' AND type = 'transfer';

-- Restore the original type constraint (remove 'transfer')
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense'));

-- Drop the index for visible column
DROP INDEX IF EXISTS idx_categories_visible;

-- Remove visible column from categories table
ALTER TABLE categories DROP COLUMN visible; 