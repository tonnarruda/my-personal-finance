-- Add transfer_id column to transactions table
ALTER TABLE transactions ADD COLUMN transfer_id VARCHAR(255);

-- Create index for better performance when searching for transfer pairs
CREATE INDEX idx_transactions_transfer_id ON transactions(transfer_id); 