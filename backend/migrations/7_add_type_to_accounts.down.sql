-- Remove a coluna type da tabela accounts
DROP INDEX IF EXISTS idx_accounts_type;
ALTER TABLE accounts DROP COLUMN IF EXISTS type; 