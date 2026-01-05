import { Response } from "express";
import { IApiResponse } from "../types";

export class ApiResponse {
    static success<T>(
        res: Response,
        data?: T,
        message: string = "Success",
        statusCode: number = 200
    ): Response {
        const response: IApiResponse<T> = {
            success: true,
            message,
            data,
        };
        return res.status(statusCode).json(response);
    }

    static created<T>(
        res: Response,
        data?: T,
        message: string = "Resource created successfully"
    ): Response {
        return this.success(res, data, message, 201);
    }

    static error(
        res: Response,
        message: string = "An error occurred",
        errors?: any[],
        statusCode: number = 500
    ): Response {
        const response: IApiResponse = {
            success: false,
            message,
            errors,
        };
        return res.status(statusCode).json(response);
    }

    static badRequest(
        res: Response,
        message: string = "Bad request",
        errors?: any[]
    ): Response {
        return this.error(res, message, errors, 400);
    }

    static unauthorized(
        res: Response,
        message: string = "Unauthorized"
    ): Response {
        return this.error(res, message, undefined, 401);
    }

    static forbidden(res: Response, message: string = "Forbidden"): Response {
        return this.error(res, message, undefined, 403);
    }

    static notFound(
        res: Response,
        message: string = "Resource not found"
    ): Response {
        return this.error(res, message, undefined, 404);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        page: number,
        limit: number,
        total: number,
        message: string = "Success"
    ): Response {
        const response: IApiResponse<T[]> = {
            success: true,
            message,
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        return res.status(200).json(response);
    }
}
