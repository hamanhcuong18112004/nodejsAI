import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../types";
import appConfig from "../config/app.config";

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("No token provided", 401);
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, appConfig.JWT_SECRET);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        next(new AppError("Invalid or expired token", 401));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("Unauthorized", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError("Forbidden - Insufficient permissions", 403)
            );
        }

        next();
    };
};
