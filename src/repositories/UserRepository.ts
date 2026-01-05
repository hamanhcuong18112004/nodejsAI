import { BaseRepository } from "./BaseRepository";
import { IUser } from "../models/database/user.model";
import { IQuery } from "../types";

export class UserRepository extends BaseRepository<IUser> {
    // In-memory storage for demo (replace with real DB)
    private users: IUser[] = [];

    constructor() {
        super("UserRepository");
    }

    async findAll(query?: IQuery): Promise<IUser[]> {
        this.log("Finding all users", query);

        let result = [...this.users.filter((u) => !u.deletedAt)];

        // Apply filters
        if (query?.filter) {
            result = result.filter((user) => {
                return Object.entries(query.filter!).every(([key, value]) => {
                    return (user as any)[key] === value;
                });
            });
        }

        // Apply search
        if (query?.search) {
            const search = query.search.toLowerCase();
            result = result.filter(
                (user) =>
                    user.email.toLowerCase().includes(search) ||
                    user.firstName.toLowerCase().includes(search) ||
                    user.lastName.toLowerCase().includes(search)
            );
        }

        // Apply pagination
        if (query?.pagination) {
            const { page, limit } = query.pagination;
            const start = (page - 1) * limit;
            result = result.slice(start, start + limit);
        }

        return result;
    }

    async findById(id: string): Promise<IUser | null> {
        this.log("Finding user by id", { id });
        return this.users.find((u) => u.id === id && !u.deletedAt) || null;
    }

    async findOne(filter: Record<string, any>): Promise<IUser | null> {
        this.log("Finding one user", filter);
        return (
            this.users.find((user) => {
                return Object.entries(filter).every(([key, value]) => {
                    return (user as any)[key] === value && !user.deletedAt;
                });
            }) || null
        );
    }

    async create(data: Partial<IUser>): Promise<IUser> {
        this.log("Creating user", data);
        const user: IUser = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
        } as IUser;

        this.users.push(user);
        return user;
    }

    async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
        this.log("Updating user", { id, data });
        const index = this.users.findIndex((u) => u.id === id && !u.deletedAt);

        if (index === -1) return null;

        this.users[index] = {
            ...this.users[index],
            ...data,
            updatedAt: new Date(),
        };

        return this.users[index];
    }

    async delete(id: string): Promise<boolean> {
        this.log("Deleting user", { id });
        const user = await this.findById(id);

        if (!user) return false;

        user.deletedAt = new Date();
        return true;
    }

    async count(filter?: Record<string, any>): Promise<number> {
        const users = this.users.filter((u) => !u.deletedAt);

        if (!filter) return users.length;

        return users.filter((user) => {
            return Object.entries(filter).every(([key, value]) => {
                return (user as any)[key] === value;
            });
        }).length;
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return this.findOne({ email });
    }
}
