-- Add visible column to categories table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='categories' AND column_name='visible'
    ) THEN
        ALTER TABLE categories ADD COLUMN visible BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Create index for visible column
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(visible);

-- Alter the type constraint to include 'transfer'
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense', 'transfer'));

-- Insert the "Transferência" category with visible=false if it doesn't exist yet
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transferência' AND type = 'transfer') THEN
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
    END IF;
END $$; 