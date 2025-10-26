-- Remove a coluna account_type da tabela accounts
ALTER TABLE accounts DROP COLUMN IF EXISTS account_type;

-- Remove índice do campo account_type
DROP INDEX IF EXISTS idx_accounts_account_type;
