import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import { createClient } from "redis";

const redisConfig = {
    socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "16379"),
    },
    password: process.env.REDIS_PASSWORD || undefined,
};
export const redis = createClient(redisConfig);

// Log kết nối Redis
redis.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
});

// Connect to Redis
redis.connect().catch(console.error);

/**
 * Checkpointer - Lưu state của LangGraph vào Redis
 *
 * Cách hoạt động:
 * - Mỗi user có 1 thread_id (userId)
 * - LangGraph tự động serialize state và lưu vào Redis
 * - Khi user chat tiếp, state được restore từ Redis
 * - Short-term memory tự động persist qua các request
 */
export const checkpointer = new RedisSaver(redis);

/**
 * Hàm kiểm tra kết nối Redis
 */

/**
 * Hàm xóa session của user (nếu cần)
 */
export async function clearUserSession(userId: string): Promise<void> {
    const pattern = `langgraph:*:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Cleared ${keys.length} keys for user ${userId}`);
    }
}
