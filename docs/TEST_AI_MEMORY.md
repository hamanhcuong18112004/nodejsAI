# 🧪 TEST AI LONG-TERM MEMORY

## 🚀 CHUẨN BỊ

1. ✅ Đã tạo Vector Index trên MongoDB Atlas (xem docs/MONGODB_VECTOR_SETUP.md)
2. ✅ Server đang chạy: `npm run dev`
3. ✅ MongoDB Atlas đã connect
4. ✅ API_KEY_NORMAL đã set trong .env

---

## 📌 ENDPOINT

```
POST http://localhost:3000/api/ai/chat
Content-Type: application/json
```

---

## 🧪 TEST CASE 1: Lần đầu hỏi (Không có memory)

### Request:

```json
{
    "userId": "user001",
    "message": "Tôi muốn mua laptop giá rẻ dưới 10 triệu"
}
```

### Expected Response:

```json
{
    "success": true,
    "data": {
        "userId": "user001",
        "userMessage": "Tôi muốn mua laptop giá rẻ dưới 10 triệu",
        "aiResponse": "Dựa vào dữ liệu, tôi thấy có laptop ABC giá 9 triệu...",
        "timestamp": "2024-01-01T10:00:00.000Z"
    }
}
```

### ✅ Kiểm tra trong MongoDB:

```javascript
db.memories.findOne({ userId: "user001" });
```

Kết quả sẽ có:

-   `summary`: Chứa câu hỏi + câu trả lời
-   `embedding`: Array 768 số (vector)
-   `createdAt`, `updatedAt`

---

## 🧪 TEST CASE 2: Hỏi tiếp (Có memory từ lần trước)

### Request (sau 5 phút):

```json
{
    "userId": "user001",
    "message": "Có cái nào bền không?"
}
```

### Expected Response:

AI sẽ nhớ user thích **giá rẻ** nên sẽ recommend theo context đó:

```json
{
    "aiResponse": "Dựa vào nhu cầu giá rẻ của bạn lần trước, tôi recommend laptop XYZ..."
}
```

---

## 🧪 TEST CASE 3: User khác (Memory riêng biệt)

### Request:

```json
{
    "userId": "user002",
    "message": "Tôi cần laptop gaming cao cấp"
}
```

### Expected:

-   user002 sẽ có memory riêng (không bị lẫn với user001)
-   AI sẽ không nhớ context của user001

---

## 🐛 DEBUG CHECKLIST

### Nếu lỗi `$vectorSearch not found`:

```bash
# Kiểm tra index trên Atlas
# Phải có index tên "vector_index" với status "Active"
```

### Nếu AI không nhớ context:

```bash
# Check MongoDB:
db.memories.find({ userId: "user001" })

# Phải có document với embedding array 768 số
# Nếu embedding = [] → Lỗi VectorService
```

### Nếu lỗi Gemini API:

```bash
# Check .env
echo $API_KEY_NORMAL

# Test embedding trực tiếp:
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":{"parts":[{"text":"test"}]}}'
```

---

## 📊 FLOW HOẠT ĐỘNG

```
1. User gửi message → POST /api/ai/chat

2. AiAgentService.handleChat():
   ├─ Tìm memory cũ (Vector Search) ← MemoryService.findRelevantMemory()
   ├─ Query SQL data             ← ProductService.getProductInfo()
   ├─ Gộp prompt + Generate AI   ← Gemini API
   └─ Lưu memory mới             ← MemoryService.updateMemory()

3. Response về client
```

---

## 🎯 KẾT QUẢ MONG ĐỢI

✅ **Memory được lưu**: Check MongoDB có document mới
✅ **Vector Search hoạt động**: Câu hỏi sau nhớ context trước
✅ **Isolated per User**: user001 ≠ user002
✅ **Cosine Similarity**: Câu hỏi tương tự sẽ match được memory

---

## 📝 EXAMPLE WITH CURL

```bash
# Test 1
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "message": "Tôi muốn mua laptop giá rẻ"
  }'

# Test 2 (sau vài giây)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "message": "Có cái nào bền không?"
  }'
```

---

## 🔥 POSTMAN COLLECTION

Import file này vào Postman:

```json
{
    "info": {
        "name": "AI Long-term Memory Test",
        "_postman_id": "ai-memory-test",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Chat with AI",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"userId\": \"user001\",\n  \"message\": \"Tôi muốn mua laptop giá rẻ\"\n}"
                },
                "url": {
                    "raw": "http://localhost:3000/api/ai/chat",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "3000",
                    "path": ["api", "ai", "chat"]
                }
            }
        }
    ]
}
```

Lưu thành file `ai-memory-test.postman_collection.json` và import vào Postman.
