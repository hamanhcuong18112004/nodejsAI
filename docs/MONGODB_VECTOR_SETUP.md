# 🔍 Hướng dẫn Setup MongoDB Atlas Vector Search Index

## ⚠️ QUAN TRỌNG

Nếu không tạo index này, `MemoryService.findRelevantMemory()` sẽ bị lỗi `$vectorSearch` không tồn tại.

---

## 📝 CÁCH TẠO INDEX (MongoDB Atlas)

### Bước 1: Truy cập MongoDB Atlas

1. Đăng nhập: https://cloud.mongodb.com
2. Chọn Cluster của bạn
3. Click vào **Database** → **Browse Collections**
4. Tìm collection: `memories`

### Bước 2: Tạo Search Index

1. Click tab **Search Indexes** (bên cạnh Collections)
2. Click **Create Search Index**
3. Chọn **JSON Editor**
4. Copy/Paste config dưới đây:

```json
{
    "mappings": {
        "dynamic": false,
        "fields": {
            "embedding": {
                "type": "knnVector",
                "dimensions": 768,
                "similarity": "cosine"
            },
            "userId": {
                "type": "string"
            },
            "isDeleted": {
                "type": "boolean"
            }
        }
    }
}
```

5. **Index Name**: Đặt tên là `vector_index` (phải trùng với code trong `memory.service.ts`)
6. **Database**: Chọn database của bạn
7. **Collection**: Chọn `memories`
8. Click **Create Search Index**

### Bước 3: Đợi Index được tạo

-   Trạng thái sẽ đổi từ `Building` → `Active` (khoảng 1-2 phút)
-   Khi status là **Active** → Bắt đầu test được!

---

## 🔢 LƯU Ý DIMENSIONS

**Gemini Embedding Model**:

-   `text-embedding-004`: 768 dimensions
-   `embedding-001`: 768 dimensions

Nếu bạn đổi model, phải cập nhật `dimensions` trong index config.

---

## ✅ KIỂM TRA INDEX HOẠT ĐỘNG

```bash
# Test query này sẽ fail nếu index chưa tạo:
db.memories.aggregate([
  {
    "$vectorSearch": {
      "index": "vector_index",
      "path": "embedding",
      "queryVector": [0.1, 0.2, ...], // 768 số
      "numCandidates": 10,
      "limit": 1
    }
  }
])
```

Nếu có lỗi `$vectorSearch is not supported` → Index chưa được tạo hoặc chưa Active.
