-- Database Schema untuk Nota Perusahaan Web App
-- Jalankan script ini di Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;

-- Create receipts table
CREATE TABLE receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(20) NOT NULL UNIQUE,
    company_code VARCHAR(10) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    receipt_id BIGINT REFERENCES receipts(id) ON DELETE CASCADE,
    quantity VARCHAR(50) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_receipts_company_code ON receipts(company_code);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
CREATE INDEX idx_items_receipt_id ON items(receipt_id);

-- Enable Row Level Security (RLS)
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public access to receipts" ON receipts FOR ALL USING (true);
CREATE POLICY "Allow public access to items" ON items FOR ALL USING (true);

-- Insert sample data for testing (optional)
INSERT INTO receipts (receipt_number, company_code, company_name, date, recipient, total_amount) VALUES
('CH00001', 'CH', 'PT. CHASTE GEMILANG MANDIRI', '2025-02-09', 'Test Customer', 100000.00),
('CR00001', 'CR', 'PT CREATIVE GLOBAL MULIA', '2025-02-09', 'Test Customer', 150000.00),
('CP00001', 'CP', 'CV. COMPAGRE', '2025-02-09', 'Test Customer', 200000.00);

-- Verify tables were created
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('receipts', 'items');
