import { MemoryService } from "../../memory.service";
import { AgentStateType } from "../state";

/**
 * Memory Node - Load long-term memory từ MongoDB
 *
 * Short-term (Redis) đã được LangGraph tự động quản lý qua checkpointer
 * Node này chỉ cần load long-term summary
 */
export const memoryNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = lastMessage.content as string;

    console.log("🧠 [Memory Node] Loading for user:", state.userId);

    try {
        // Lấy long-term memory từ MongoDB
        const longTermSummary = await MemoryService.findRelevantMemory(
            state.userId,
            userMessage
        );

        console.log(
            "🧠 [Memory Node] Found:",
            longTermSummary?.substring(0, 100) || "Empty"
        );

        return { longTermSummary: longTermSummary || "" };
    } catch (error) {
        console.error("❌ [Memory Node] Error:", error);
        return { longTermSummary: "" };
    }
};
