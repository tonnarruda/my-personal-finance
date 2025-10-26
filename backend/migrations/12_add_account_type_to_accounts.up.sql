-- Adiciona a coluna account_type na tabela accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);

-- Cria índice para o campo account_type
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
