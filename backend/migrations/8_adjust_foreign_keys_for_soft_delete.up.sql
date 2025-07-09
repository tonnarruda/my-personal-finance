-- Migration para ajustar foreign keys das transações para usar RESTRICT
-- Isso impede a exclusão de contas e categorias que tenham transações associadas

-- Remove as foreign keys existentes
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_category;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_account;

-- Recria as foreign keys com RESTRICT
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_category 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;

ALTER TABLE transactions ADD CONSTRAINT fk_transaction_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;

-- Comentário explicativo
COMMENT ON CONSTRAINT fk_transaction_category ON transactions IS 'Impede exclusão de categorias que tenham transações associadas';
COMMENT ON CONSTRAINT fk_transaction_account ON transactions IS 'Impede exclusão de contas que tenham transações associadas'; 