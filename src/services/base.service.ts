import { IService, IQuery } from "../types";
import { logger } from "../utils/Logger";

export abstract class BaseService<T> implements IService<T> {
    protected serviceName: string;

    constructor(serviceName: string = "BaseService") {
        this.serviceName = serviceName;
    }

    /**
     * Find all records
     */
    async findAll(query?: IQuery): Promise<T[]> {
        throw new Error(`${this.serviceName}.findAll() must be implemented`);
    }

    /**
     * Find record by ID
     */
    async findById(id: string): Promise<T | null> {
        throw new Error(`${this.serviceName}.findById() must be implemented`);
    }

    /**
     * Create new record
     */
    async create(data: Partial<T>): Promise<T> {
        throw new Error(`${this.serviceName}.create() must be implemented`);
    }

    /**
     * Update existing record
     */
    async update(id: string, data: Partial<T>): Promise<T | null> {
        throw new Error(`${this.serviceName}.update() must be implemented`);
    }

    /**
     * Delete record
     */
    async delete(id: string): Promise<boolean> {
        throw new Error(`${this.serviceName}.delete() must be implemented`);
    }

    /**
     * Log service operations
     */
    protected log(message: string, meta?: any): void {
        logger.info(`[${this.serviceName}] ${message}`, meta);
    }

    /**
     * Log errors
     */
    protected logError(message: string, error: any): void {
        logger.error(`[${this.serviceName}] ${message}`, error);
    }
}
