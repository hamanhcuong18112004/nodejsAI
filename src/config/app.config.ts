export default {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",

    // API
    API_PREFIX: process.env.API_PREFIX || "/api/v1",

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,

    // JWT
    JWT_SECRET:
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
    JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",

    // Database
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: parseInt(process.env.DB_PORT || "5432"),
    DB_NAME: process.env.DB_NAME || "superai_db",
    DB_USER: process.env.DB_USER || "postgres",
    DB_PASSWORD: process.env.DB_PASSWORD || "password",

    // MongoDB (nếu dùng)
    MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/superai",

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    LOG_FILE: process.env.LOG_FILE || "logs/app.log",
};
