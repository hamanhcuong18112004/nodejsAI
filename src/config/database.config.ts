import appConfig from "./app.config";

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    dialect: "postgres" | "mysql" | "sqlite" | "mssql";
    logging: boolean;
    pool: {
        max: number;
        min: number;
        acquire: number;
        idle: number;
    };
}

export const databaseConfig: DatabaseConfig = {
    host: appConfig.DB_HOST,
    port: appConfig.DB_PORT,
    database: appConfig.DB_NAME,
    username: appConfig.DB_USER,
    password: appConfig.DB_PASSWORD,
    dialect: "postgres",
    logging: appConfig.NODE_ENV === "development",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};

// MongoDB Config
export const mongoConfig = {
    uri: appConfig.MONGO_URI,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    },
};

export default databaseConfig;
