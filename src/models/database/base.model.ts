import { IBaseModel } from "../../types";

export abstract class BaseModel implements IBaseModel {
    id!: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;

    constructor(data?: Partial<BaseModel>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    /**
     * Convert model to plain object
     */
    toJSON(): Record<string, any> {
        return { ...this };
    }

    /**
     * Check if model is soft deleted
     */
    isDeleted(): boolean {
        return this.deletedAt !== null && this.deletedAt !== undefined;
    }

    /**
     * Soft delete the model
     */
    softDelete(): void {
        this.deletedAt = new Date();
    }

    /**
     * Restore soft deleted model
     */
    restore(): void {
        this.deletedAt = null;
    }
}
