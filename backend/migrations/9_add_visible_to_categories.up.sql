-- Add visible column to categories table
ALTER TABLE categories ADD COLUMN visible BOOLEAN DEFAULT TRUE;

-- Create index for visible column
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(visible);

-- Alter the type constraint to include 'transfer'
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense', 'transfer'));

-- Insert the "Transferência" category with visible=false
INSERT INTO categories (id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, user_id) 
VALUES (
    gen_random_uuid()::VARCHAR(36), 
    'Transferência', 
    'Categoria para transferências entre contas', 
    'transfer', 
    '#6B7280', 
    'transfer', 
    NULL, 
    TRUE, 
    FALSE, 
    NOW(), 
    NOW(), 
    NULL
); 