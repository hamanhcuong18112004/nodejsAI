import { Request, Response, NextFunction } from "express";

// Base Types
export interface IBaseModel {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

// Request/Response Types
export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface IPaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IQuery {
    filter?: Record<string, any>;
    pagination?: IPaginationOptions;
    search?: string;
}

// Controller Types
export type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

export interface IController {
    index?: AsyncRequestHandler;
    show?: AsyncRequestHandler;
    store?: AsyncRequestHandler;
    update?: AsyncRequestHandler;
    destroy?: AsyncRequestHandler;
}

// Service Types
export interface IService<T> {
    findAll(query?: IQuery): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}

// Repository Types
export interface IRepository<T> {
    findAll(query?: IQuery): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findOne(filter: Record<string, any>): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: Record<string, any>): Promise<number>;
}

// Error Types
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
