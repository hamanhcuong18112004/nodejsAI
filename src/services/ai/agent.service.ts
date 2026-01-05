import { GoogleGenerativeAI } from "@google/generative-ai";
import { MemoryService } from "./memory.service";
import { ProductService } from "../product.service";
import { chatWithLangGraph, getChatHistory } from "./langgraph";

// const genAI = new GoogleGenerativeAI(process.env.API_KEY_PRO || "");

// export class AiAgentService {
//     static async handleChat(userId: string, message: string) {
//         // Dùng model mạnh hơn để hiểu context tốt hơn
//         const model = genAI.getGenerativeModel({
//             model: "gemini-2.5-flash", // Thay "gemini-2.5-flash-lite" bằng model mạnh hơn
//         });

//         // 1. LẤY TRÍ NHỚ (Từ MongoDB Cloud)
//         const history = await MemoryService.findRelevantMemory(userId, message);
//         // console.log("📜 FULL HISTORY:", history);

//         // 3. PROMPT ĐÁNH GIÁ (Reasoning)
//         const prompt = `Bạn là trợ lý bán hàng thông minh TechStore với khả năng ghi nhớ khách hàng.

// LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ (ĐỌC KỸ - có chứa thông tin quan trọng về khách hàng):
// ${history || "Chưa có lịch sử"}

// CÂU HỎI HIỆN TẠI: ${message}

// HƯỚNG DẪN TRẢ LỜI:
// 1. ĐỌC KỸ lịch sử hội thoại ở trên
// 2. Nếu khách hỏi về thông tin CÁ NHÂN (tên, sở thích, yêu cầu đã nói trước):
//    - Tìm trong lịch sử và TRẢ LỜI CHÍNH XÁC
//    - VD: "Khách hỏi: Tôi tên là Cường" → Khi hỏi tên → trả lời "Anh tên Cường ạ"

// 3. Nếu khách hỏi về SẢN PHẨM:
//    - Dùng thông tin từ lịch sử để biết sở thích
//    - Tư vấn phù hợp

// 4. Trả lời ngắn gọn (dưới 50 từ), thân thiện, bằng tiếng Việt
// 5. KHÔNG tự ý bịa thông tin không có trong lịch sử

// TRẢ LỜI:`;

//         const result = await model.generateContent(prompt);
//         const responseText = result.response.text();

//         // 4. LƯU LẠI KÝ ỨC MỚI (Lưu cả câu hỏi và câu trả lời)
//         await MemoryService.updateMemory(
//             userId,
//             `Khách hỏi: ${message} | AI trả lời: ${responseText}`
//         );

//         return responseText;
//     }
// }

export class AiAgentService {
    /**
     * Handle chat message từ user
     */
    static async handleChat(userId: string, message: string): Promise<string> {
        return await chatWithLangGraph(userId, message);
    }

    /**
     * Lấy lịch sử chat của user
     */
    static async getHistory(userId: string): Promise<any[]> {
        return await getChatHistory(userId);
    }
}
