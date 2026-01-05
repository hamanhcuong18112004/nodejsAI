# 📘 Hướng dẫn sử dụng Database Connection

## ✅ Đã setup xong

### 1. **Kết nối tự động khi start server**

File `server.ts` và `app.ts` đã được cấu hình để:
- Kết nối MySQL & MongoDB khi start
- Đóng kết nối khi shutdown (Ctrl+C)

**Bạn không cần làm gì thêm!** Chỉ cần chạy:
```bash
npm run dev
```

---

## 🔧 Cách dùng trong Code

### 📌 **1. Dùng MySQL Pool trong Repository**

```typescript
// File: src/repositories/ProductRepository.ts
import { getMySQLPool } from "../database/connect";

export class ProductRepository {
  
  async findAll() {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM products');
    return rows;
  }
  
  async findById(id: number) {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?', 
      [id]
    );
    return rows[0];
  }
  
  async create(data: any) {
    const pool = getMySQLPool();
    const [result] = await pool.query(
      'INSERT INTO products (name, price) VALUES (?, ?)',
      [data.name, data.price]
    );
    return result;
  }
  
  async update(id: number, data: any) {
    const pool = getMySQLPool();
    const [result] = await pool.query(
      'UPDATE products SET name = ?, price = ? WHERE id = ?',
      [data.name, data.price, id]
    );
    return result;
  }
  
  async delete(id: number) {
    const pool = getMySQLPool();
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
  }
}
```

---

### 📌 **2. Dùng MongoDB với Mongoose**

MongoDB đã tự động kết nối, bạn chỉ cần dùng models:

```typescript
// File: src/models/ai/memory.schema.ts (đã có sẵn)
import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: String,
  summary: String,
  embedding: [Number],
});

export default mongoose.model('Memory', memorySchema);
```

```typescript
// File: src/services/ai/memory.service.ts
import MemoryModel from "../../models/ai/memory.schema";

export class MemoryService {
  
  static async createMemory(userId: string, summary: string) {
    const memory = new MemoryModel({
      userId,
      summary,
      embedding: []
    });
    
    return await memory.save();
  }
  
  static async findByUserId(userId: string) {
    return await MemoryModel.find({ userId });
  }
  
  static async deleteMemory(id: string) {
    return await MemoryModel.findByIdAndDelete(id);
  }
}
```

---

### 📌 **3. Dùng Transaction (MySQL)**

```typescript
import { getMySQLPool } from "../database/connect";

async function transferMoney(fromId: number, toId: number, amount: number) {
  const pool = getMySQLPool();
  const connection = await pool.getConnection();
  
  try {
    // Bắt đầu transaction
    await connection.beginTransaction();
    
    // Trừ tiền user A
    await connection.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    
    // Cộng tiền user B
    await connection.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    // Commit nếu thành công
    await connection.commit();
    
  } catch (error) {
    // Rollback nếu lỗi
    await connection.rollback();
    throw error;
    
  } finally {
    // Trả connection về pool
    connection.release();
  }
}
```

---

## 🎯 Ví dụ thực tế

### **ProductService sử dụng ProductRepository:**

```typescript
// File: src/services/product.service.ts
import { ProductRepository } from "../repositories/ProductRepository";

export class ProductService {
  private productRepo: ProductRepository;
  
  constructor() {
    this.productRepo = new ProductRepository();
  }
  
  async getAllProducts() {
    // Repository sẽ tự động dùng pool
    return await this.productRepo.findAll();
  }
  
  async getProduct(id: number) {
    return await this.productRepo.findById(id);
  }
  
  async createProduct(data: any) {
    return await this.productRepo.create(data);
  }
}
```

### **Controller gọi Service:**

```typescript
// File: src/controllers/product.controller.ts
import { ProductService } from "../services/product.service";

export class ProductController {
  private productService: ProductService;
  
  constructor() {
    this.productService = new ProductService();
  }
  
  async getAll(req: Request, res: Response) {
    try {
      const products = await this.productService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get products' });
    }
  }
}
```

---

## 🚀 Chạy thử

```bash
# 1. Start server
npm run dev

# Kết quả trong console:
# 🔄 Đang kết nối đến các databases...
# ✅ Kết nối MySQL thành công!
# ✅ Kết nối MongoDB thành công!
# ✅ Đã kết nối thành công tất cả databases!
# ✅ Databases connected successfully
# 🚀 Server is running on port 3000
```

---

## ⚠️ Lưu ý quan trọng

### ✅ **ĐÚNG:**
```typescript
// Lấy pool 1 lần, dùng nhiều lần
const pool = getMySQLPool();
await pool.query('SELECT ...');
await pool.query('SELECT ...');
```

### ❌ **SAI:**
```typescript
// KHÔNG tạo connection mới mỗi lần
const conn = await mysql.createConnection({...}); // ← SAI!
```

### ✅ **Transaction - ĐÚNG:**
```typescript
const connection = await pool.getConnection(); // Lấy từ pool
try {
  await connection.beginTransaction();
  // ... queries
  await connection.commit();
} finally {
  connection.release(); // ← PHẢI TRẢ VỀ POOL
}
```

### ❌ **Transaction - SAI:**
```typescript
const connection = await pool.getConnection();
await connection.beginTransaction();
// ... queries
await connection.commit();
// ← THIẾU: connection.release() → Connection leak!
```

---

## 📝 Checklist

- [x] `connectAllDatabases()` được gọi trong `app.ts`
- [x] `disconnectAll()` được gọi khi shutdown
- [x] Repositories/Services dùng `getMySQLPool()`
- [x] MongoDB models hoạt động trực tiếp với Mongoose
- [x] Transaction nhớ `.release()` sau khi xong

---

## 🆘 Troubleshooting

### **Lỗi: "MySQL chưa được khởi tạo"**
→ Server chưa kết nối database. Check logs xem có lỗi không.

### **Lỗi: "Too many connections"**
→ Quên `connection.release()` trong transaction. Check code.

### **MongoDB không kết nối**
→ Check `MONGO_URI` trong `.env` file
