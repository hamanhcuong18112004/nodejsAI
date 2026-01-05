import "dotenv/config";
import { App } from "./app";
import { logger } from "./utils/Logger";
import { disconnectAll } from "./database/connect";

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
    logger.error("Unhandled Rejection", reason);
    process.exit(1);
});

// Initialize and start the application
const app = new App();
app.listen();

// Graceful shutdown
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
    await disconnectAll();
    process.exit(0);
});

process.on("SIGINT", async () => {
    logger.info("SIGINT received. Shutting down gracefully...");
    await disconnectAll();
    process.exit(0);
});
