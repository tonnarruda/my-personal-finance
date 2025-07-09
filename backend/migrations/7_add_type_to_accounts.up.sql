-- Adiciona a coluna type na tabela accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS type VARCHAR(10) CHECK (type IN ('income', 'expense'));

-- Cria índice para o campo type
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type); 