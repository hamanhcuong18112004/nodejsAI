import { Request, Response, NextFunction } from "express";
import { BaseController } from "./base.controller";
import { UserService } from "../services/user.service";
import { SUCCESS_MESSAGES } from "../utils/constants";

export class UserController extends BaseController {
    private userService: UserService;

    constructor() {
        super("UserController");
        this.userService = new UserService();
    }

    /**
     * Get all users
     * GET /api/users
     */
    index = this.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const pagination = this.getPagination(req);
            const filters = this.getFilters(req);
            const search = req.query.search as string;

            const users = await this.userService.findAll({
                filter: filters,
                pagination,
                search,
            });

            // If pagination requested, send paginated response
            if (req.query.page) {
                const total = 100; // Get total from service/repository
                return this.sendPaginated(
                    res,
                    users,
                    pagination.page,
                    pagination.limit,
                    total,
                    SUCCESS_MESSAGES.FETCHED
                );
            }

            return this.sendSuccess(res, users, SUCCESS_MESSAGES.FETCHED);
        }
    );

    /**
     * Get single user
     * GET /api/users/:id
     */
    show = this.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;
            const user = await this.userService.findById(id);

            return this.sendSuccess(res, user, SUCCESS_MESSAGES.FETCHED);
        }
    );

    /**
     * Create new user
     * POST /api/users
     */
    store = this.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const user = await this.userService.create(req.body);

            return this.sendCreated(res, user, SUCCESS_MESSAGES.CREATED);
        }
    );

    /**
     * Update user
     * PUT /api/users/:id
     */
    update = this.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;
            const user = await this.userService.update(id, req.body);

            return this.sendSuccess(res, user, SUCCESS_MESSAGES.UPDATED);
        }
    );

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    destroy = this.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;
            await this.userService.delete(id);

            return this.sendSuccess(res, null, SUCCESS_MESSAGES.DELETED);
        }
    );
}
