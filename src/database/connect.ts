import mongoose from "mongoose";
import mysql from "mysql2/promise";
import config from "../config/app.config";

// ==================== MYSQL CONNECTION ====================
let mysqlPool: mysql.Pool | null = null;

export const connectMySQL = async (
    retries = 5,
    delay = 2000
): Promise<mysql.Pool> => {
    try {
        if (mysqlPool) {
            console.log("✅ MySQL đã kết nối trước đó, sử dụng lại pool");
            return mysqlPool;
        }

        mysqlPool = mysql.createPool({
            host: config.DB_HOST,
            port: config.DB_PORT,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            database: config.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            connectTimeout: 10000,
        });

        // Test connection với retry logic
        for (let i = 0; i < retries; i++) {
            try {
                const connection = await mysqlPool.getConnection();
                console.log("✅ Kết nối MySQL thành công!");
                connection.release();
                return mysqlPool;
            } catch (err) {
                if (i === retries - 1) throw err;
                console.log(
                    `⚠️ Kết nối MySQL thất bại (lần ${
                        i + 1
                    }/${retries}), thử lại sau ${delay}ms...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        return mysqlPool;
    } catch (error) {
        console.error("❌ Lỗi kết nối MySQL:", error);
        mysqlPool = null;
        throw error;
    }
};

export const getMySQLPool = (): mysql.Pool => {
    if (!mysqlPool) {
        throw new Error("MySQL chưa được khởi tạo! Gọi connectMySQL() trước.");
    }
    return mysqlPool;
};

// ==================== MONGODB CONNECTION ====================
export const connectMongoDB = async (): Promise<typeof mongoose> => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("✅ MongoDB đã kết nối trước đó");
            return mongoose;
        }

        const mongooseInstance = await mongoose.connect(config.MONGO_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 (fix Windows localhost -> ::1 issue)
        });

        console.log("✅ Kết nối MongoDB thành công!");

        // Event listeners
        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB bị ngắt kết nối");
        });

        return mongooseInstance;
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error);
        throw error;
    }
};

// ==================== DISCONNECT ALL ====================
export const disconnectAll = async (): Promise<void> => {
    try {
        // Close MySQL
        if (mysqlPool) {
            await mysqlPool.end();
            mysqlPool = null;
            console.log("✅ Đã đóng kết nối MySQL");
        }

        // Close MongoDB
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("✅ Đã đóng kết nối MongoDB");
        }
    } catch (error) {
        console.error("❌ Lỗi khi đóng kết nối:", error);
        throw error;
    }
};

// ==================== INITIALIZE ALL DATABASES ====================
export const connectAllDatabases = async (): Promise<void> => {
    try {
        console.log("🔄 Đang kết nối đến các databases...");

        await Promise.all([connectMySQL(), connectMongoDB()]);

        console.log("✅ Đã kết nối thành công tất cả databases!");
    } catch (error) {
        console.error("❌ Lỗi khi kết nối databases:", error);
        throw error;
    }
};
