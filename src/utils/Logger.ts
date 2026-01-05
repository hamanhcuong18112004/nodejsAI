export enum LogLevel {
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG",
}

export class Logger {
    private static instance: Logger;
    private isDevelopment: boolean;

    private constructor() {
        this.isDevelopment = process.env.NODE_ENV !== "production";
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(
        level: LogLevel,
        message: string,
        meta?: any
    ): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : "";
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }

    error(message: string, error?: Error | any): void {
        const formatted = this.formatMessage(LogLevel.ERROR, message, error);
        console.error(formatted);
    }

    warn(message: string, meta?: any): void {
        const formatted = this.formatMessage(LogLevel.WARN, message, meta);
        console.warn(formatted);
    }

    info(message: string, meta?: any): void {
        const formatted = this.formatMessage(LogLevel.INFO, message, meta);
        console.info(formatted);
    }

    debug(message: string, meta?: any): void {
        if (this.isDevelopment) {
            const formatted = this.formatMessage(LogLevel.DEBUG, message, meta);
            console.debug(formatted);
        }
    }
}

export const logger = Logger.getInstance();
