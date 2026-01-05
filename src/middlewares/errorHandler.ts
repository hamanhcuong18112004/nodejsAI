import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";
import { ApiResponse } from "../utils/ApiResponse";
import { logger } from "../utils/Logger";
import appConfig from "../config/app.config";

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors: any[] | undefined;

    // Handle known AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Handle Validation Errors
    if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Validation Error";
        errors = Object.values((err as any).errors || {}).map(
            (e: any) => e.message
        );
    }

    // Handle JWT Errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    // Handle Mongoose CastError
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // Handle Duplicate Key Error
    if ((err as any).code === 11000) {
        statusCode = 409;
        message = "Duplicate field value entered";
    }

    // Log error
    logger.error(`${statusCode} - ${message}`, {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // Send error response
    return ApiResponse.error(
        res,
        message,
        appConfig.NODE_ENV === "development" ? [{ stack: err.stack }] : errors,
        statusCode
    );
};
