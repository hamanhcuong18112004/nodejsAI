import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { errorHandler, notFoundHandler, requestLogger } from "./middlewares";
import routes from "./routes";
import appConfig from "./config/app.config";
import { logger } from "./utils/Logger";
import { connectAllDatabases } from "./database/connect";

export class App {
    public app: Application;
    private port: number | string;

    constructor() {
        this.app = express();
        this.port = appConfig.PORT;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS
        this.app.use(
            cors({
                origin: appConfig.CORS_ORIGIN,
                credentials: true,
            })
        );

        // Compression
        this.app.use(compression());

        // Body parsers
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Request logger
        this.app.use(requestLogger);

        logger.info("Middlewares initialized");
    }

    private initializeRoutes(): void {
        // API routes
        this.app.use(appConfig.API_PREFIX, routes);

        // Root route
        this.app.get("/", (req, res) => {
            res.json({
                success: true,
                message: "Welcome to SuperAI API",
                version: "1.0.0",
                documentation: `${appConfig.API_PREFIX}/docs`,
            });
        });

        logger.info("Routes initialized");
    }

    private initializeErrorHandling(): void {
        // 404 handler
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);

        logger.info("Error handlers initialized");
    }

    private async initializeDatabases(): Promise<void> {
        try {
            await connectAllDatabases();

            logger.info("✅ Databases connected successfully");
        } catch (error) {
            logger.error("❌ Database connection failed:", error);
            throw error;
        }
    }

    public async listen(): Promise<void> {
        try {
            // Connect databases first
            await this.initializeDatabases();

            // Then start server
            this.app.listen(this.port, () => {
                logger.info(`🚀 Server is running on port ${this.port}`);
                logger.info(`📍 Environment: ${appConfig.NODE_ENV}`);
                logger.info(
                    `🌐 API URL: http://localhost:${this.port}${appConfig.API_PREFIX}`
                );
            });
        } catch (error) {
            logger.error("Failed to start server:", error);
            process.exit(1);
        }
    }

    public getApp(): Application {
        return this.app;
    }
}
