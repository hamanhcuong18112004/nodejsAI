import { IRepository, IQuery } from "../types";
import { logger } from "../utils/Logger";

export abstract class BaseRepository<T> implements IRepository<T> {
    protected repositoryName: string;

    constructor(repositoryName: string = "BaseRepository") {
        this.repositoryName = repositoryName;
    }

    /**
     * Find all records
     */
    async findAll(query?: IQuery): Promise<T[]> {
        throw new Error(`${this.repositoryName}.findAll() must be implemented`);
    }

    /**
     * Find record by ID
     */
    async findById(id: string): Promise<T | null> {
        throw new Error(
            `${this.repositoryName}.findById() must be implemented`
        );
    }

    /**
     * Find one record by filter
     */
    async findOne(filter: Record<string, any>): Promise<T | null> {
        throw new Error(`${this.repositoryName}.findOne() must be implemented`);
    }

    /**
     * Create new record
     */
    async create(data: Partial<T>): Promise<T> {
        throw new Error(`${this.repositoryName}.create() must be implemented`);
    }

    /**
     * Update existing record
     */
    async update(id: string, data: Partial<T>): Promise<T | null> {
        throw new Error(`${this.repositoryName}.update() must be implemented`);
    }

    /**
     * Delete record (soft delete)
     */
    async delete(id: string): Promise<boolean> {
        throw new Error(`${this.repositoryName}.delete() must be implemented`);
    }

    /**
     * Count records
     */
    async count(filter?: Record<string, any>): Promise<number> {
        throw new Error(`${this.repositoryName}.count() must be implemented`);
    }

    /**
     * Log repository operations
     */
    protected log(message: string, meta?: any): void {
        logger.debug(`[${this.repositoryName}] ${message}`, meta);
    }

    /**
     * Log errors
     */
    protected logError(message: string, error: any): void {
        logger.error(`[${this.repositoryName}] ${message}`, error);
    }
}
