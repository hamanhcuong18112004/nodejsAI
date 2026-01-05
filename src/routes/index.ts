import { Router } from "express";
import userRoutes from "./user.routes";
import aiRoutes from "./ai.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// API routes
router.use("/users", userRoutes);
router.use("/ai", aiRoutes);

// Add more routes here
// router.use('/posts', postRoutes);
// router.use('/auth', authRoutes);
// router.use('/products', productRoutes);

export default router;
