import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/Logger";

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const { method, originalUrl, ip } = req;
        const { statusCode } = res;

        logger.info(`${method} ${originalUrl}`, {
            statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent: req.get("user-agent"),
        });
    });

    next();
};
