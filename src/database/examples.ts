/**
 * VÍ DỤ THỰC TẾ: Cách sử dụng MySQL Pool và MongoDB
 */

import { getMySQLPool } from "../database/connect";
import MemoryModel from "../models/ai/memory.schema";

// ==================== MYSQL EXAMPLES ====================

/**
 * Ví dụ 1: Query đơn giản
 */
export async function getAllUsers() {
  const pool = getMySQLPool();
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
}

/**
 * Ví dụ 2: Query có parameters (tránh SQL injection)
 */
export async function getUserById(userId: number) {
  const pool = getMySQLPool();
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  return (rows as any[])[0];
}

/**
 * Ví dụ 3: Insert data
 */
export async function createUser(name: string, email: string) {
  const pool = getMySQLPool();
  const [result] = await pool.query(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );
  
  return {
    id: (result as any).insertId,
    name,
    email
  };
}

/**
 * Ví dụ 4: Update data
 */
export async function updateUser(id: number, name: string) {
  const pool = getMySQLPool();
  await pool.query(
    'UPDATE users SET name = ? WHERE id = ?',
    [name, id]
  );
}

/**
 * Ví dụ 5: Delete data
 */
export async function deleteUser(id: number) {
  const pool = getMySQLPool();
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

/**
 * Ví dụ 6: Transaction (chuyển tiền)
 */
export async function transferMoney(fromId: number, toId: number, amount: number) {
  const pool = getMySQLPool();
  const connection = await pool.getConnection();
  
  try {
    // Bắt đầu transaction
    await connection.beginTransaction();
    
    // Kiểm tra số dư
    const [rows] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [fromId]
    );
    const balance = (rows as any[])[0]?.balance || 0;
    
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Trừ tiền người gửi
    await connection.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    
    // Cộng tiền người nhận
    await connection.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    // Commit transaction
    await connection.commit();
    console.log('✅ Transfer successful');
    
  } catch (error) {
    // Rollback nếu có lỗi
    await connection.rollback();
    console.log('❌ Transfer failed, rolled back');
    throw error;
    
  } finally {
    // QUAN TRỌNG: Phải trả connection về pool
    connection.release();
  }
}

/**
 * Ví dụ 7: Query phức tạp (JOIN)
 */
export async function getUserWithOrders(userId: number) {
  const pool = getMySQLPool();
  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      o.id as order_id,
      o.total,
      o.created_at
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = ?
  `;
  
  const [rows] = await pool.query(query, [userId]);
  return rows;
}

// ==================== MONGODB EXAMPLES ====================

/**
 * Ví dụ 8: Tạo document mới
 */
export async function createMemory(userId: string, summary: string) {
  const memory = new MemoryModel({
    userId,
    summary,
    embedding: [],
    isDeleted: false
  });
  
  return await memory.save();
}

/**
 * Ví dụ 9: Tìm documents
 */
export async function findMemoriesByUser(userId: string) {
  return await MemoryModel.find({ 
    userId, 
    isDeleted: false 
  });
}

/**
 * Ví dụ 10: Tìm 1 document
 */
export async function findMemoryById(id: string) {
  return await MemoryModel.findById(id);
}

/**
 * Ví dụ 11: Update document
 */
export async function updateMemory(id: string, summary: string) {
  return await MemoryModel.findByIdAndUpdate(
    id,
    { summary, updatedAt: new Date() },
    { new: true } // Trả về document sau khi update
  );
}

/**
 * Ví dụ 12: Soft delete
 */
export async function softDeleteMemory(id: string) {
  return await MemoryModel.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
}

/**
 * Ví dụ 13: Hard delete
 */
export async function hardDeleteMemory(id: string) {
  return await MemoryModel.findByIdAndDelete(id);
}

/**
 * Ví dụ 14: Aggregation (thống kê)
 */
export async function getMemoryStats() {
  return await MemoryModel.aggregate([
    // Group theo userId
    {
      $group: {
        _id: '$userId',
        total: { $sum: 1 },
        avgEmbeddingLength: { $avg: { $size: '$embedding' } }
      }
    },
    // Sắp xếp theo total giảm dần
    { $sort: { total: -1 } },
    // Lấy top 10
    { $limit: 10 }
  ]);
}

// ==================== MIXED EXAMPLE (MySQL + MongoDB) ====================

/**
 * Ví dụ 15: Kết hợp MySQL và MongoDB
 */
export async function createUserWithMemory(
  name: string, 
  email: string, 
  initialMemory: string
) {
  const pool = getMySQLPool();
  
  // 1. Tạo user trong MySQL
  const [result] = await pool.query(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );
  
  const userId = (result as any).insertId;
  
  // 2. Tạo memory trong MongoDB
  const memory = new MemoryModel({
    userId: userId.toString(),
    summary: initialMemory,
    embedding: []
  });
  
  await memory.save();
  
  return {
    userId,
    name,
    email,
    memoryId: memory._id
  };
}
