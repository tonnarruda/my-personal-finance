-- Adiciona a coluna user_id nas tabelas accounts e categories
ALTER TABLE accounts ADD COLUMN user_id VARCHAR(36);
ALTER TABLE categories ADD COLUMN user_id VARCHAR(36);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; 