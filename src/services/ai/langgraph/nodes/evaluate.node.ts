import { AIMessage } from "@langchain/core/messages";
import { expertModel } from "../models";
import { AgentStateType } from "../state";

/**
 * Evaluate Node - AI xịn xử lý và trả lời
 *
 * Input: Tất cả thông tin đã thu thập
 * - messages (short-term từ Redis)
 * - longTermSummary (từ MongoDB)
 * - sqlData (từ MySQL)
 * - intent (đã phân loại)
 *
 * Output: finalResponse + AIMessage
 */
export const evaluatorNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = lastMessage.content as string;

    console.log("🤖 [Evaluator Node] Processing...");

    // Format short-term messages (5 tin nhắn gần nhất)
    const recentMessages = state.messages
        .slice(-10) // 5 cặp user-ai
        .map((m) => {
            const role = m._getType() === "human" ? "Khách" : "AI";
            return `${role}: ${m.content}`;
        })
        .join("\n");

    const prompt = `Bạn là trợ lý bán hàng thông minh của TechStore.

═══════════════════════════════════════════════════
📋 THÔNG TIN ĐÃ THU THẬP:
═══════════════════════════════════════════════════

🎯 Ý ĐỊNH NGƯỜI DÙNG: ${state.intent}
   (${state.intentReasoning})

💬 LỊCH SỬ CHAT GẦN ĐÂY (Short-term Memory):
${recentMessages || "Chưa có"}

📚 TÓM TẮT QUÁ KHỨ (Long-term Memory):
${state.longTermSummary || "Chưa có lịch sử trước đó"}

💾 DỮ LIỆU TỪ DATABASE:
${state.sqlData || "Không có dữ liệu SQL"}

❓ CÂU HỎI HIỆN TẠI:
${userMessage}

═══════════════════════════════════════════════════
📝 HƯỚNG DẪN TRẢ LỜI:
═══════════════════════════════════════════════════

1. ĐỌC KỸ tất cả thông tin ở trên
2. Nếu hỏi thông tin CÁ NHÂN (tên, sở thích) → Tìm trong lịch sử
3. Nếu hỏi SẢN PHẨM → Dùng dữ liệu SQL
4. Trả lời NGẮN GỌN (dưới 50 từ), thân thiện
5. KHÔNG bịa thông tin không có trong dữ liệu
6. Dùng tiếng Việt

TRẢ LỜI:`;

    try {
        const response = await expertModel.invoke(prompt);
        const responseText = response.content as string;

        console.log(
            "🤖 [Evaluator Node] Response:",
            responseText.substring(0, 100)
        );

        return {
            finalResponse: responseText,
            messages: [new AIMessage(responseText)],
        };
    } catch (error) {
        console.error("❌ [Evaluator Node] Error:", error);
        const fallback = "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.";
        return {
            finalResponse: fallback,
            messages: [new AIMessage(fallback)],
        };
    }
};
