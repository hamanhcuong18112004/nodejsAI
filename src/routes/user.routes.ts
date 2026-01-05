import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { validate } from "../middlewares";
import {
    createUserValidator,
    updateUserValidator,
} from "../validators/userValidator";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();
const userController = new UserController();

// Public routes
router.get("/", userController.index);
router.get("/:id", userController.show);

// Protected routes - require authentication
router.post(
    "/",
    authenticate,
    validate(createUserValidator),
    userController.store
);

router.put(
    "/:id",
    authenticate,
    validate(updateUserValidator),
    userController.update
);

// Admin only routes
router.delete("/:id", authenticate, authorize("admin"), userController.destroy);

export default router;
