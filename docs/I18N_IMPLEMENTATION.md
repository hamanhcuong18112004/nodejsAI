# Multi-Language Implementation Guide

## Tổng quan

Hệ thống hỗ trợ đa ngôn ngữ (i18n) với cơ chế fallback tự động: khi không có bản dịch cho ngôn ngữ yêu cầu, hệ thống sẽ tự động sử dụng tiếng Anh (hoặc ngôn ngữ có sẵn đầu tiên).

## Kiến trúc Database

### Phương pháp: Separate Translation Table ✅

**Lý do chọn:**

-   ✅ Scalable khi thêm ngôn ngữ mới
-   ✅ Dễ query, filter, search theo ngôn ngữ
-   ✅ Có thể thêm metadata (translator, status, version)
-   ✅ Dễ implement fallback mechanism
-   ✅ Không lãng phí storage cho các field không cần dịch

### Schema

```sql
-- Bảng chính (dữ liệu không phụ thuộc ngôn ngữ)
products (
  id, sku, price, stock, is_active, created_at, updated_at
)

-- Bảng dịch (dữ liệu phụ thuộc ngôn ngữ)
product_translations (
  id, product_id, language_code, name, description, created_at, updated_at
  UNIQUE(product_id, language_code)
)
```

## Cơ chế Fallback

### Fallback Chain

```
zh (Chinese) → en (English) → first available
vi (Vietnamese) → en (English) → first available
ja (Japanese) → en (English) → first available
```

### Query với Fallback

```sql
-- Approach 1: Using COALESCE with subqueries
SELECT
  p.*,
  COALESCE(
    (SELECT name FROM product_translations WHERE product_id = p.id AND language_code = 'zh'),
    (SELECT name FROM product_translations WHERE product_id = p.id AND language_code = 'en'),
    (SELECT name FROM product_translations WHERE product_id = p.id LIMIT 1)
  ) as name
FROM products p;

-- Approach 2: Using LEFT JOIN with ORDER BY
SELECT p.*, pt.name, pt.description
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id
  AND pt.language_code IN ('zh', 'en')
WHERE p.id = 1
ORDER BY CASE pt.language_code
  WHEN 'zh' THEN 0
  WHEN 'en' THEN 1
  ELSE 2
END
LIMIT 1;
```

## API Usage

### 1. Get Products với Language Support

**Request:**

```http
GET /api/products?lang=zh
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8

GET /api/products
Accept-Language: vi-VN,vi;q=0.9
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "sku": "PROD001",
            "price": 99.99,
            "name": "无线耳机",
            "description": "具有降噪功能的高品质无线耳机"
        },
        {
            "id": 2,
            "sku": "PROD002",
            "price": 149.99,
            "name": "Smart Watch", // Fallback to English (no Chinese translation)
            "description": "Fitness tracking smart watch with heart rate monitor"
        }
    ],
    "meta": {
        "language": "zh",
        "count": 2
    }
}
```

### 2. Create Product với Multiple Translations

**Request:**

```http
POST /api/products
Content-Type: application/json

{
  "sku": "PROD004",
  "price": 199.99,
  "stock": 30,
  "translations": [
    {
      "languageCode": "en",
      "name": "Gaming Mouse",
      "description": "RGB gaming mouse with 16000 DPI"
    },
    {
      "languageCode": "vi",
      "name": "Chuột gaming",
      "description": "Chuột gaming RGB với 16000 DPI"
    },
    {
      "languageCode": "zh",
      "name": "游戏鼠标",
      "description": "RGB游戏鼠标，16000 DPI"
    }
  ]
}
```

### 3. Update Translation

**Request:**

```http
PUT /api/products/2/translations/zh
Content-Type: application/json

{
  "name": "智能手表",
  "description": "具有心率监测功能的健身追踪智能手表"
}
```

## Code Structure

```
src/
├── models/
│   ├── Product.ts                 # Product model
│   └── ProductTranslation.ts      # Translation model
├── repositories/
│   └── ProductRepository.ts       # Database queries with fallback logic
├── services/
│   └── ProductService.ts          # Business logic
├── controllers/
│   └── ProductController.ts       # API endpoints
├── utils/
│   └── i18n.ts                    # i18n utilities & fallback chain
└── routes/
    └── product.routes.ts          # Route definitions
```

## Best Practices

### 1. Language Detection Priority

```
1. Query parameter (?lang=zh)
2. Accept-Language header
3. Default language (en)
```

### 2. Luôn có bản dịch tiếng Anh

-   Tiếng Anh là fallback mặc định
-   Mọi product phải có ít nhất 1 bản dịch tiếng Anh

### 3. Validation

```typescript
// Validate language code
if (!isSupportedLanguage(lang)) {
    throw new Error("Unsupported language");
}

// Require at least one translation
if (!translations || translations.length === 0) {
    throw new Error("At least one translation required");
}
```

### 4. Performance Optimization

-   Index trên `product_id` và `language_code`
-   Cache translations cho products hay truy cập
-   Use COALESCE để giảm số lượng queries

## Migration Path

### Từ JSON Column sang Separate Table

```sql
-- Migrate existing JSON data
INSERT INTO product_translations (product_id, language_code, name, description)
SELECT
  id,
  'en',
  name->>'en',
  description->>'en'
FROM products_old;

-- Repeat for each language
```

## Testing Examples

```typescript
// Test fallback: Request Chinese, get English
const product = await productService.getProductById(2, "zh");
expect(product.name).toBe("Smart Watch"); // English fallback

// Test primary language
const product = await productService.getProductById(1, "zh");
expect(product.name).toBe("无线耳机"); // Chinese translation exists
```

## Advanced Features (Optional)

### 1. Translation Status

```sql
ALTER TABLE product_translations ADD COLUMN status VARCHAR(20) DEFAULT 'published';
-- draft, in_review, published
```

### 2. Translation Versioning

```sql
ALTER TABLE product_translations ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE product_translations ADD COLUMN translated_by VARCHAR(100);
```

### 3. Missing Translation Report

```sql
-- Find products missing translations
SELECT p.id, p.sku, COUNT(pt.id) as translation_count
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id
GROUP BY p.id, p.sku
HAVING COUNT(pt.id) < 5; -- Assuming 5 supported languages
```

## Summary

✅ **Khuyến nghị:** Sử dụng **Separate Translation Table**
✅ **Fallback:** Chinese → English → First Available
✅ **API:** Support cả query param và Accept-Language header
✅ **Performance:** Indexed, optimized queries với COALESCE
✅ **Scalable:** Dễ thêm ngôn ngữ mới mà không cần alter schema
