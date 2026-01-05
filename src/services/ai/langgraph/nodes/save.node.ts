import { MemoryService } from "../../memory.service";
import { AgentStateType } from "../state";

export const saveNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    const lastUserMessage = state.messages[state.messages.length - 2];
    const lastAIMessage = state.messages[state.messages.length - 1];

    // Chỉ lưu nếu có cả user message và AI response
    if (!lastUserMessage || !lastAIMessage) {
        console.log("💾 [Save Node] Skipping - incomplete conversation");
        return {};
    }

    const userContent = lastUserMessage.content as string;
    const aiContent = lastAIMessage.content as string;

    console.log("💾 [Save Node] Saving to MongoDB...");

    try {
        // Format entry cho MongoDB
        const entry = `Khách hỏi: ${userContent} | AI trả lời: ${aiContent}`;

        await MemoryService.updateMemory(state.userId, entry);

        console.log("💾 [Save Node] Saved successfully");
        return {};
    } catch (error) {
        console.error("❌ [Save Node] Error:", error);
        // Không throw error để không ảnh hưởng response
        return {};
    }
};
