/**
 * Intent Node - Phân loại ý định của người dùng
 *
 * Input: messages (tin nhắn cuối cùng)
 * Output: intent, intentReasoning
 *
 * Dùng AI củi vì task đơn giản, tiết kiệm chi phí
 */

import { cheapModel } from "../models";
import { AgentStateType, IntentType } from "../state";

export const intentNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    // Lấy tin nhắn cuối cùng
    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = lastMessage.content as string;

    console.log("🎯 [Intent Node] Analyzing:", userMessage);

    const prompt = `Bạn là hệ thống phân loại ý định (Intent Classifier).

Phân loại câu hỏi sau vào 1 trong các loại:

CÂU HỎI: "${userMessage}"

CÁC LOẠI INTENT:
1. "product_query" - Hỏi về 1 sản phẩm CỤ THỂ (có tên hoặc ID)
   VD: "iPhone 15 giá bao nhiêu?", "Sản phẩm #5 còn hàng không?"
   
2. "product_browse" - Muốn XEM DANH SÁCH sản phẩm
   VD: "Có điện thoại nào?", "Cho tôi xem laptop", "Có gì bán?"
   
3. "product_compare" - SO SÁNH 2 hoặc nhiều sản phẩm
   VD: "So sánh iPhone 15 và Samsung S23", "iPhone 15 vs iPhone 16", 
       "Khác nhau giữa A và B như thế nào?", "Nên chọn X hay Y?"
   ⚠️ ƯU TIÊN: Nếu có từ "so sánh", "vs", "hay", "khác nhau" → CHỌN product_compare!
   
4. "chitchat" - Chào hỏi, cảm ơn, nói chuyện phiếm
   VD: "Chào bạn", "Cảm ơn nhiều", "Tạm biệt"
   
5. "personal_info" - Chia sẻ hoặc hỏi thông tin CÁ NHÂN
   VD: "Tôi tên Cường", "Tôi thích màu xanh", "Tên tôi là gì?"
   
6. "memory_recall" - Hỏi về những gì đã nói TRƯỚC ĐÓ
   VD: "Tôi đã hỏi gì?", "Bạn nhớ tôi nói gì không?"
   
7. "order_check" - Kiểm tra đơn hàng, lịch sử mua
   VD: "Đơn của tôi đến đâu rồi?", "Tôi đã mua gì?"
   
8. "unknown" - Không thuộc các loại trên

TRẢ VỀ JSON (KHÔNG CÓ MARKDOWN):
{"intent": "loại_intent", "reasoning": "giải thích ngắn"}`;

    try {
        const response = await cheapModel.invoke(prompt);
        const content = response.content as string;

        // Parse JSON từ response
        // Loại bỏ markdown nếu có
        const cleanContent = content
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const result = JSON.parse(cleanContent);

        console.log("🎯 [Intent Node] Result:", result);

        return {
            intent: result.intent as IntentType,
            intentReasoning: result.reasoning,
        };
    } catch (error) {
        console.error("❌ [Intent Node] Error:", error);
        // Fallback nếu parse lỗi
        return {
            intent: "chitchat",
            intentReasoning: "Fallback do lỗi parse JSON",
        };
    }
};
