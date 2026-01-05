import { BaseModel } from "./base.model";

export interface IUser {
    id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user" | "moderator";
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export class User extends BaseModel implements IUser {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user" | "moderator";
    isActive: boolean;
    lastLogin?: Date;

    constructor(data: Partial<IUser>) {
        super(data);
        this.email = data.email || "";
        this.password = data.password || "";
        this.firstName = data.firstName || "";
        this.lastName = data.lastName || "";
        this.role = data.role || "user";
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.lastLogin = data.lastLogin;
    }

    getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    toJSON(): Record<string, any> {
        const obj = super.toJSON();
        delete obj.password; // Never expose password
        return obj;
    }
}
