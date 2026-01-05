import { Request, Response, NextFunction } from "express";
import { IController, AsyncRequestHandler } from "../types";
import { ApiResponse } from "../utils/ApiResponse";
import { logger } from "../utils/Logger";

export abstract class BaseController implements IController {
    protected serviceName: string;

    constructor(serviceName: string = "BaseController") {
        this.serviceName = serviceName;
    }

    /**
     * Wrap async route handlers to catch errors
     */
    protected asyncHandler(fn: AsyncRequestHandler): AsyncRequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                logger.error(`Error in ${this.serviceName}`, error);
                next(error);
            }
        };
    }

    /**
     * Get pagination parameters from request
     */
    protected getPagination(req: Request) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const sortBy = req.query.sortBy as string;
        const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

        return { page, limit, sortBy, sortOrder };
    }

    /**
     * Get filter parameters from request
     */
    protected getFilters(req: Request): Record<string, any> {
        const { page, limit, sortBy, sortOrder, search, ...filters } =
            req.query;
        return filters;
    }

    /**
     * Send success response
     */
    protected sendSuccess<T>(
        res: Response,
        data?: T,
        message?: string,
        statusCode?: number
    ) {
        return ApiResponse.success(res, data, message, statusCode);
    }

    /**
     * Send created response
     */
    protected sendCreated<T>(res: Response, data?: T, message?: string) {
        return ApiResponse.created(res, data, message);
    }

    /**
     * Send error response
     */
    protected sendError(
        res: Response,
        message: string,
        errors?: any[],
        statusCode?: number
    ) {
        return ApiResponse.error(res, message, errors, statusCode);
    }

    /**
     * Send not found response
     */
    protected sendNotFound(res: Response, message?: string) {
        return ApiResponse.notFound(res, message);
    }

    /**
     * Send paginated response
     */
    protected sendPaginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message?: string
    ) {
        return ApiResponse.paginated(res, data, page, limit, total, message);
    }

    // Override these methods in child controllers
    async index?(req: Request, res: Response, next: NextFunction): Promise<any>;
    async show?(req: Request, res: Response, next: NextFunction): Promise<any>;
    async store?(req: Request, res: Response, next: NextFunction): Promise<any>;
    async update?(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any>;
    async destroy?(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<any>;
}
