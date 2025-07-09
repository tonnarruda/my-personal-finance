-- Rollback: Restaura as foreign keys originais com CASCADE

-- Remove as foreign keys com RESTRICT
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_category;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transaction_account;

-- Recria as foreign keys originais com CASCADE
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_category 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE transactions ADD CONSTRAINT fk_transaction_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE; 