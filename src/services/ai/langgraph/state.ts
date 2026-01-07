import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export type IntentType =
    | "product_query" // Hỏi sản phẩm cụ thể (có ID/tên) → Cần SQL
    | "product_browse" // Muốn xem danh sách → Cần getAll
    | "product_compare" // So sánh sản phẩm → Cần SQL
    | "chitchat" // Chào hỏi, cảm ơn → KHÔNG cần SQL
    | "personal_info" // "Tên tôi là..." → KHÔNG cần SQL, chỉ lưu
    | "memory_recall" // "Tôi đã hỏi gì?" → KHÔNG cần SQL
    | "order_check" // Kiểm tra đơn hàng → Cần SQL khác
    | "unknown"; // Không xác định

/**
 * State của Agent - Dữ liệu chạy qua các node
 *
 * Reducer: Quy tắc merge khi state được update
 * - (x, y) => x.concat(y): Nối mảng (dùng cho messages)
 * - (x, y) => y: Ghi đè (dùng cho các field khác)
 */

export const AgentState = Annotation.Root({
    // Messages trong conversation hiện tại (short-term từ Redis)
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),

    // Tóm tắt từ long-term memory (MongoDB)
    longTermSummary: Annotation<string>({
        reducer: (_, y) => y,
    }),

    // Dữ liệu SQL (sản phẩm, đơn hàng...)
    sqlData: Annotation<string | null>({
        reducer: (_, y) => y,
    }),

    // UserId để query
    userId: Annotation<string>({
        reducer: (_, y) => y,
    }),

    // Intent đã phân loại
    intent: Annotation<IntentType>({
        reducer: (_, y) => y,
    }),

    // Giải thích intent (để debug)
    intentReasoning: Annotation<string>({
        reducer: (_, y) => y,
    }),

    // Response cuối cùng
    finalResponse: Annotation<string>({
        reducer: (_, y) => y,
    }),
});
export type AgentStateType = typeof AgentState.State;
