import { BaseService } from "./base.service";
import { IUser } from "../models/database/user.model";
import { UserRepository } from "../repositories/UserRepository";
import { IQuery, AppError } from "../types";
import bcrypt from "bcrypt";

export class UserService extends BaseService<IUser> {
    private userRepository: UserRepository;

    constructor() {
        super("UserService");
        this.userRepository = new UserRepository();
    }

    async findAll(query?: IQuery): Promise<IUser[]> {
        this.log("Finding all users", query);
        return await this.userRepository.findAll(query);
    }

    async findById(id: string): Promise<IUser | null> {
        this.log("Finding user by id", { id });
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        return user;
    }

    async create(data: Partial<IUser>): Promise<IUser> {
        this.log("Creating user", { email: data.email });

        // Check if email exists
        const existingUser = await this.userRepository.findByEmail(data.email!);
        if (existingUser) {
            throw new AppError("Email already exists", 409);
        }

        // Hash password
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        return await this.userRepository.create(data);
    }

    async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
        this.log("Updating user", { id });

        // Check if user exists
        await this.findById(id);

        // If updating email, check for duplicates
        if (data.email) {
            const existingUser = await this.userRepository.findByEmail(
                data.email
            );
            if (existingUser && existingUser.id !== id) {
                throw new AppError("Email already exists", 409);
            }
        }

        // Hash password if being updated
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        return await this.userRepository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        this.log("Deleting user", { id });

        // Check if user exists
        await this.findById(id);

        return await this.userRepository.delete(id);
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await this.userRepository.findByEmail(email);
    }

    async validatePassword(
        password: string,
        hashedPassword: string
    ): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }
}
