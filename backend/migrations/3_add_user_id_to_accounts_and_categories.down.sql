-- Remove a coluna user_id das tabelas accounts e categories
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS fk_accounts_user;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_user;

DROP INDEX IF EXISTS idx_accounts_user_id;
DROP INDEX IF EXISTS idx_categories_user_id;

ALTER TABLE accounts DROP COLUMN IF EXISTS user_id;
ALTER TABLE categories DROP COLUMN IF EXISTS user_id; 