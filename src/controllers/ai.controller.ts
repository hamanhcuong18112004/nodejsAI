import { Request, Response } from "express";
import { AiAgentService } from "../services/ai/agent.service";
import { BaseController } from "./base.controller";

export class AiController extends BaseController {
    constructor() {
        super("AiController");
    }

    /**
     * POST /api/ai/chat
     * Body: { userId: "user123", message: "Có laptop giá rẻ không?" }
     */
    async chat(req: Request, res: Response) {
        try {
            const { userId, message } = req.body;

            // Validate
            if (!userId || !message) {
                return this.sendError(
                    res,
                    "userId và message là bắt buộc",
                    undefined,
                    400
                );
            }

            // Call AI Agent
            const response = await AiAgentService.handleChat(userId, message);

            return this.sendSuccess(res, {
                userId,
                userMessage: message,
                aiResponse: response,
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            return this.sendError(
                res,
                error.message || "Lỗi xử lý AI",
                undefined,
                500
            );
        }
    }
}
