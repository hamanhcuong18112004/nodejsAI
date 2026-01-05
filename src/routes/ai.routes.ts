import { Router } from "express";
import { AiController } from "../controllers/ai.controller";

const router = Router();
const aiController = new AiController();

/**
 * POST /api/ai/chat
 * Test AI Long-term Memory
 */
router.post("/chat", (req, res) => aiController.chat(req, res));

export default router;
