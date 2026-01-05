-- Migration: Create products and product_translations tables
-- Description: Support for multi-language product information with fallback mechanism

-- Create products table (main data, language-independent)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product_translations table
CREATE TABLE IF NOT EXISTS product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  language_code VARCHAR(5) NOT NULL, -- 'en', 'vi', 'zh', 'ja', 'ko'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, language_code) -- One translation per language per product
);

-- Create indexes for better performance
CREATE INDEX idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX idx_product_translations_language_code ON product_translations(language_code);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_translations_updated_at BEFORE UPDATE ON product_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO products (sku, price, stock) VALUES
  ('PROD001', 99.99, 100),
  ('PROD002', 149.99, 50),
  ('PROD003', 29.99, 200);

-- Insert translations
INSERT INTO product_translations (product_id, language_code, name, description) VALUES
  -- Product 1 translations
  (1, 'en', 'Wireless Headphones', 'High-quality wireless headphones with noise cancellation'),
  (1, 'vi', 'Tai nghe không dây', 'Tai nghe không dây chất lượng cao với khử tiếng ồn'),
  (1, 'zh', '无线耳机', '具有降噪功能的高品质无线耳机'),
  
  -- Product 2 translations (only en and vi)
  (2, 'en', 'Smart Watch', 'Fitness tracking smart watch with heart rate monitor'),
  (2, 'vi', 'Đồng hồ thông minh', 'Đồng hồ thông minh theo dõi sức khỏe với cảm biến nhịp tim'),
  
  -- Product 3 translations (only en)
  (3, 'en', 'USB-C Cable', 'Fast charging USB-C cable, 2 meters');

-- Comments
COMMENT ON TABLE products IS 'Main product table storing language-independent data';
COMMENT ON TABLE product_translations IS 'Product translations for multi-language support with fallback to English';
COMMENT ON COLUMN product_translations.language_code IS 'ISO 639-1 language code (en, vi, zh, ja, ko)';
