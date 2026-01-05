import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { AgentState, AgentStateType } from "./state";
import {
    intentNode,
    sqlNode,
    memoryNode,
    evaluatorNode,
    saveNode,
} from "./nodes";
import { checkpointer } from "./checkpointer";

/**
 * Conditional Router - Quyết định có cần query SQL không
 *
 * @param state - Current state
 * @returns Tên node tiếp theo
 */
function shouldFetchSQL(state: AgentStateType): string {
    const needSQL = ["product_query", "product_browse", "order_check"];

    if (needSQL.includes(state.intent)) {
        console.log("🔀 [Router] → sql_fetch");
        return "sql_fetch";
    }

    console.log("🔀 [Router] → memory_load (skip SQL)");
    return "memory_load";
}

/**
 * Build LangGraph Workflow
 *
 * Flow:
 * START → intent → (conditional) → sql OR memory
 *                                      ↓
 *                                   evaluate
 *                                      ↓
 *                                    save
 *                                      ↓
 *                                     END
 */
const workflow = new StateGraph(AgentState)
    // Thêm các nodes
    .addNode("intent_classify", intentNode)
    .addNode("sql_fetch", sqlNode)
    .addNode("memory_load", memoryNode)
    .addNode("evaluate", evaluatorNode)
    .addNode("save_memory", saveNode)

    // Định nghĩa edges
    .addEdge(START, "intent_classify")

    // Conditional edge sau intent
    .addConditionalEdges("intent_classify", shouldFetchSQL, {
        sql_fetch: "sql_fetch",
        memory_load: "memory_load",
    })

    // SQL → Memory → Evaluate → Save → END
    .addEdge("sql_fetch", "memory_load")
    .addEdge("memory_load", "evaluate")
    .addEdge("evaluate", "save_memory")
    .addEdge("save_memory", END);

/**
 * Compile graph với Redis checkpointer
 */
const app = workflow.compile({ checkpointer });

/**
 * Hàm chính để chat với LangGraph
 *
 * @param userId - ID của user (dùng làm thread_id trong Redis)
 * @param message - Tin nhắn từ user
 * @returns Response từ AI
 */
export async function chatWithLangGraph(
    userId: string,
    message: string
): Promise<string> {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 [LangGraph] New message from:", userId);
    console.log("📩 Message:", message);
    console.log("=".repeat(50));

    // Config với thread_id = userId
    // Redis sẽ lưu state theo thread_id này
    const config = {
        configurable: { thread_id: userId },
    };

    try {
        // Invoke graph
        const result = await app.invoke(
            {
                messages: [new HumanMessage(message)],
                userId,
                longTermSummary: "",
                sqlData: null,
                intent: "unknown",
                intentReasoning: "",
                finalResponse: "",
            },
            config
        );

        console.log("=".repeat(50));
        console.log("✅ [LangGraph] Completed");
        console.log("=".repeat(50) + "\n");

        return result.finalResponse;
    } catch (error) {
        console.error("❌ [LangGraph] Error:", error);
        throw error;
    }
}

/**
 * Hàm lấy lịch sử chat của user (từ Redis)
 */
export async function getChatHistory(userId: string): Promise<any[]> {
    const config = {
        configurable: { thread_id: userId },
    };

    const state = await app.getState(config);
    return state.values.messages || [];
}

/**
 * Export graph để debug nếu cần
 */
export { app as langGraphApp };
