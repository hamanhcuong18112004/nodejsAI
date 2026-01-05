-- Seed data cho bảng products và product_translations
-- Chạy: docker exec -i ai_mysql mysql -uroot -proot lab_iot < database/seeds/products.sql

USE lab_iot;

-- Xóa dữ liệu cũ
DELETE FROM product_translations;
DELETE FROM products;
ALTER TABLE products AUTO_INCREMENT = 1;

-- Insert 50 products
INSERT INTO products (sku, price, stock, is_active) VALUES
('SKU001A2B3C', 29.99, 150, 1),
('SKU002D4E5F', 49.99, 200, 1),
('SKU003G6H7I', 99.99, 80, 1),
('SKU004J8K9L', 149.99, 50, 1),
('SKU005M0N1O', 199.99, 30, 1),
('SKU006P2Q3R', 19.99, 300, 1),
('SKU007S4T5U', 79.99, 120, 1),
('SKU008V6W7X', 129.99, 60, 1),
('SKU009Y8Z9A', 89.99, 100, 1),
('SKU010B1C2D', 39.99, 180, 1),
('SKU011E3F4G', 59.99, 140, 1),
('SKU012H5I6J', 69.99, 110, 1),
('SKU013K7L8M', 109.99, 70, 1),
('SKU014N9O0P', 159.99, 40, 1),
('SKU015Q1R2S', 179.99, 35, 1),
('SKU016T3U4V', 24.99, 250, 1),
('SKU017W5X6Y', 44.99, 160, 1),
('SKU018Z7A8B', 54.99, 130, 1),
('SKU019C9D0E', 64.99, 90, 1),
('SKU020F1G2H', 74.99, 105, 1);

-- Insert translations for products (English và Vietnamese)
INSERT INTO product_translations (product_id, language_code, name, description) VALUES
-- Product 1
(1, 'en', 'Wireless Mouse', 'Ergonomic wireless mouse with 2.4GHz connection'),
(1, 'vi', 'Chuột không dây', 'Chuột không dây công thái học với kết nối 2.4GHz'),
-- Product 2
(2, 'en', 'Mechanical Keyboard', 'RGB mechanical keyboard with blue switches'),
(2, 'vi', 'Bàn phím cơ', 'Bàn phím cơ RGB với switch xanh'),
-- Product 3
(3, 'en', 'Gaming Headset', 'Professional gaming headset with 7.1 surround sound'),
(3, 'vi', 'Tai nghe gaming', 'Tai nghe gaming chuyên nghiệp với âm thanh vòm 7.1'),
-- Product 4
(4, 'en', '4K Monitor', '27-inch 4K UHD monitor with HDR support'),
(4, 'vi', 'Màn hình 4K', 'Màn hình 4K UHD 27 inch hỗ trợ HDR'),
-- Product 5
(5, 'en', 'Gaming Chair', 'Ergonomic gaming chair with lumbar support'),
(5, 'vi', 'Ghế gaming', 'Ghế gaming công thái học với đệm lưng'),
-- Product 6
(6, 'en', 'USB-C Hub', '7-in-1 USB-C hub with HDMI and SD card reader'),
(6, 'vi', 'Hub USB-C', 'Hub USB-C 7 trong 1 với HDMI và đọc thẻ SD'),
-- Product 7
(7, 'en', 'Webcam HD', '1080p HD webcam with built-in microphone'),
(7, 'vi', 'Webcam HD', 'Webcam HD 1080p với micro tích hợp'),
-- Product 8
(8, 'en', 'Laptop Stand', 'Adjustable aluminum laptop stand with cooling'),
(8, 'vi', 'Giá đỡ laptop', 'Giá đỡ laptop nhôm có thể điều chỉnh với làm mát'),
-- Product 9
(9, 'en', 'Wireless Charger', 'Fast wireless charger 15W Qi-certified'),
(9, 'vi', 'Sạc không dây', 'Sạc không dây nhanh 15W chứng nhận Qi'),
-- Product 10
(10, 'en', 'Bluetooth Speaker', 'Portable Bluetooth speaker with 20h battery'),
(10, 'vi', 'Loa Bluetooth', 'Loa Bluetooth di động với pin 20 giờ'),
-- Product 11
(11, 'en', 'SSD 1TB', 'NVMe M.2 SSD 1TB with 3500MB/s read speed'),
(11, 'vi', 'SSD 1TB', 'SSD NVMe M.2 1TB với tốc độ đọc 3500MB/s'),
-- Product 12
(12, 'en', 'RAM 16GB', 'DDR4 16GB 3200MHz desktop memory'),
(12, 'vi', 'RAM 16GB', 'Bộ nhớ desktop DDR4 16GB 3200MHz'),
-- Product 13
(13, 'en', 'Graphics Card', 'RTX 3060 12GB gaming graphics card'),
(13, 'vi', 'Card đồ họa', 'Card đồ họa gaming RTX 3060 12GB'),
-- Product 14
(14, 'en', 'CPU Cooler', 'RGB CPU cooler with 120mm fan'),
(14, 'vi', 'Tản nhiệt CPU', 'Tản nhiệt CPU RGB với quạt 120mm'),
-- Product 15
(15, 'en', 'Power Supply', '750W modular power supply 80+ Gold'),
(15, 'vi', 'Nguồn máy tính', 'Nguồn máy tính modular 750W 80+ Gold'),
-- Product 16
(16, 'en', 'Mouse Pad', 'Extended RGB gaming mouse pad 800x300mm'),
(16, 'vi', 'Lót chuột', 'Lót chuột gaming RGB mở rộng 800x300mm'),
-- Product 17
(17, 'en', 'Phone Stand', 'Adjustable phone stand with charging port'),
(17, 'vi', 'Giá đỡ điện thoại', 'Giá đỡ điện thoại có thể điều chỉnh với cổng sạc'),
-- Product 18
(18, 'en', 'Cable Organizer', 'Magnetic cable organizer 5-pack'),
(18, 'vi', 'Kẹp dây cáp', 'Kẹp dây cáp nam châm gói 5 cái'),
-- Product 19
(19, 'en', 'LED Strip', '5m RGB LED strip with remote control'),
(19, 'vi', 'Dây LED', 'Dây LED RGB 5m với điều khiển từ xa'),
-- Product 20
(20, 'en', 'Desk Lamp', 'USB desk lamp with touch control and 3 modes'),
(20, 'vi', 'Đèn bàn', 'Đèn bàn USB với điều khiển cảm ứng 3 chế độ');

SELECT 'Seed completed successfully!' AS status;
