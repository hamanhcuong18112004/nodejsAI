# 🚀 HƯỚNG DẪN IMPLEMENT LANGGRAPH + REDIS CHO AI AGENT

> **Tác giả:** AI Assistant  
> **Ngày tạo:** 04/01/2026  
> **Dự án:** SuperAI - TechStore Chatbot

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [PHASE 0: Chuẩn bị môi trường](#2-phase-0-chuẩn-bị-môi-trường)
3. [PHASE 1: Tạo LangGraph Core Files](#3-phase-1-tạo-langgraph-core-files)
4. [PHASE 2: Tạo các Node Logic](#4-phase-2-tạo-các-node-logic)
5. [PHASE 3: Kết nối Graph + Cập nhật Service](#5-phase-3-kết-nối-graph--cập-nhật-service)
6. [PHASE 4: Test & Debug](#6-phase-4-test--debug)
7. [Troubleshooting](#7-troubleshooting)
8. [Checklist tổng hợp](#8-checklist-tổng-hợp)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1. Sơ đồ Flow

```
                         ┌─────────────────────────────┐
                         │       USER MESSAGE          │
                         └─────────────┬───────────────┘
                                       │
                         ┌─────────────▼───────────────┐
                         │  1️⃣ INTENT CLASSIFIER        │
                         │  (AI củi - phân loại)       │
                         │  Output: intent type        │
                         └─────────────┬───────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ product_query   │    │ product_browse  │    │ chitchat/       │
    │ (cần SQL cụ thể)│    │ (cần getAll)    │    │ personal_info   │
    └────────┬────────┘    └────────┬────────┘    │ (SKIP SQL)      │
             │                      │              └────────┬────────┘
             └──────────┬───────────┘                       │
                        ▼                                   │
              ┌─────────────────┐                           │
              │  2️⃣ SQL NODE     │                           │
              │  (Query MySQL)  │                           │
              └────────┬────────┘                           │
                       │                                    │
                       └──────────────┬─────────────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │  3️⃣ MEMORY LOADER        │
                         │  Long-term (MongoDB)    │
                         └─────────────┬───────────┘
                                       ▼
                         ┌─────────────────────────┐
                         │  4️⃣ EVALUATOR NODE       │
                         │  (AI xịn - reasoning)   │
                         └─────────────┬───────────┘
                                       ▼
                         ┌─────────────────────────┐
                         │  5️⃣ SAVE MEMORY          │
                         │  → MongoDB (long-term)  │
                         │  → Redis (short-term)   │
                         └─────────────────────────┘
```

### 1.2. Cấu trúc thư mục sau khi hoàn thành

```
src/services/ai/
├── agent.service.ts          # (SỬA) - Entry point, gọi LangGraph
├── memory.service.ts         # (SỬA) - Thêm summarization
├── vector.service.ts         # (GIỮ NGUYÊN)
│
└── langgraph/                # (MỚI) - Thư mục chính
    ├── index.ts              # Export chính + build graph
    ├── models.ts             # 2 AI models (củi + xịn)
    ├── state.ts              # State definition
    ├── checkpointer.ts       # Redis checkpointer
    │
    └── nodes/                # (MỚI) - Các node logic
        ├── intent.node.ts    # Phân loại ý định
        ├── sql.node.ts       # Query SQL
        ├── memory.node.ts    # Load long-term memory
        ├── evaluate.node.ts  # AI reasoning
        └── save.node.ts      # Save memory
```

### 1.3. Giải thích các thành phần

| Thành phần            | Vai trò                                | Database      |
| --------------------- | -------------------------------------- | ------------- |
| **Short-term Memory** | Lưu messages trong 1 session (30 phút) | Redis         |
| **Long-term Memory**  | Lưu tóm tắt vĩnh viễn                  | MongoDB Atlas |
| **Intent Classifier** | Phân loại ý định để routing            | AI củi        |
| **Evaluator**         | Reasoning + trả lời                    | AI xịn        |
| **SQL Node**          | Lấy data sản phẩm                      | MySQL         |

---

## 2. PHASE 0: CHUẨN BỊ MÔI TRƯỜNG

### 2.1. Cài đặt packages

Mở terminal trong VS Code (Ctrl + `) và chạy:

```bash
cd "c:\ha manh cuong\work\superAI"

npm install @langchain/google-genai @langchain/langgraph @langchain/langgraph-checkpoint-redis ioredis @langchain/core
```

**Giải thích packages:**
| Package | Mục đích |
|---------|----------|
| `@langchain/google-genai` | Wrapper LangChain cho Gemini API |
| `@langchain/langgraph` | Framework xây dựng workflow graph |
| `@langchain/langgraph-checkpoint-redis` | Lưu state vào Redis |
| `@langchain/core` | Core types (HumanMessage, AIMessage) |
| `ioredis` | Redis client cho Node.js |

### 2.2. Kiểm tra Redis

**Bước 1:** Kiểm tra file `docker-compose.yml` có Redis chưa:

```yaml
# Nếu chưa có, thêm vào docker-compose.yml:
redis:
    image: redis:7-alpine
    container_name: superai-redis
    ports:
        - "6379:6379"
    volumes:
        - ./redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
```

**Bước 2:** Chạy Redis:

```bash
docker-compose up -d redis
```

**Bước 3:** Kiểm tra Redis đang chạy:

```bash
docker ps | grep redis
# Hoặc
docker-compose ps
```

**Bước 4:** Test kết nối Redis:

```bash
docker exec -it superai-redis redis-cli ping
# Expected output: PONG
```

### 2.3. Kiểm tra biến môi trường

Mở file `.env` và đảm bảo có:

```env
# AI API Keys
API_KEY_PRO=your_gemini_pro_key_here
API_KEY_NORMAL=your_gemini_normal_key_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB (đã có)
MONGODB_URI=mongodb+srv://...
```

### 2.4. Tạo cấu trúc thư mục

Chạy các lệnh sau trong terminal:

```bash
# Tạo thư mục langgraph
mkdir -p "src/services/ai/langgraph/nodes"

# Kiểm tra
ls -la src/services/ai/langgraph/
```

**Hoặc tạo thủ công trong VS Code:**

1. Click chuột phải vào `src/services/ai/`
2. New Folder → `langgraph`
3. Click chuột phải vào `langgraph/`
4. New Folder → `nodes`

### ✅ Checklist Phase 0

-   [ ] Đã chạy `npm install` thành công (done)
-   [ ] Redis đang chạy (`docker ps` thấy redis)
-   [ ] Có API keys trong `.env`
-   [ ] Đã tạo thư mục `langgraph/` và `langgraph/nodes/`

---

## 3. PHASE 1: TẠO LANGGRAPH CORE FILES

### 3.1. Tạo file `src/services/ai/langgraph/models.ts`

**Mục đích:** Khởi tạo 2 model AI - củi (tiết kiệm) và xịn (reasoning)

**Tạo file:** Click chuột phải `langgraph/` → New File → `models.ts`

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Model Xịn (Expert) - Dùng cho reasoning và đưa quyết định
 * - Gemini 2.0 Flash: Nhanh, thông minh
 * - Dùng cho: Evaluate node, trả lời khách hàng
 */
export const expertModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.API_KEY_PRO,
    temperature: 0.7, // Sáng tạo vừa phải
});

/**
 * Model Củi (Worker) - Dùng cho các task đơn giản
 * - Gemini 1.5 Flash: Rẻ, nhanh
 * - Dùng cho: Intent classification, extract data, summarization
 */
export const cheapModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.API_KEY_NORMAL,
    temperature: 0.1, // Ít sáng tạo, chính xác hơn
});

/**
 * Lý do dùng 2 model:
 * 1. Tiết kiệm chi phí: Intent classify không cần model xịn
 * 2. Tốc độ: Model củi nhanh hơn
 * 3. Chất lượng: Reasoning cần model xịn để chính xác
 */
```

**Test file:** Thêm đoạn code test tạm ở cuối file:

```typescript
// Test (xóa sau khi test xong)
async function testModels() {
    console.log("Testing cheapModel...");
    const cheap = await cheapModel.invoke("Xin chào");
    console.log("CheapModel:", cheap.content);

    console.log("Testing expertModel...");
    const expert = await expertModel.invoke("Xin chào");
    console.log("ExpertModel:", expert.content);
}
// testModels();
```

---

### 3.2. Tạo file `src/services/ai/langgraph/state.ts`

**Mục đích:** Định nghĩa State - dữ liệu được truyền qua các node

**Tạo file:** `langgraph/state.ts`

```typescript
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Định nghĩa các loại Intent
 */
export type IntentType =
    | "product_query" // Hỏi sản phẩm cụ thể (có ID/tên) → Cần SQL
    | "product_browse" // Muốn xem danh sách → Cần getAll
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

// Export type để dùng trong các node
export type AgentStateType = typeof AgentState.State;
```

---

### 3.3. Tạo file `src/services/ai/langgraph/checkpointer.ts`

**Mục đích:** Kết nối Redis để lưu short-term memory

**Tạo file:** `langgraph/checkpointer.ts`

```typescript
import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";
import Redis from "ioredis";

/**
 * Cấu hình Redis từ environment variables
 */
const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    // Tự động reconnect nếu mất kết nối
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
};

/**
 * Redis client instance
 */
export const redis = new Redis(redisConfig);

// Log kết nối Redis
redis.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
});

/**
 * Checkpointer - Lưu state của LangGraph vào Redis
 *
 * Cách hoạt động:
 * - Mỗi user có 1 thread_id (userId)
 * - LangGraph tự động serialize state và lưu vào Redis
 * - Khi user chat tiếp, state được restore từ Redis
 * - Short-term memory tự động persist qua các request
 */
export const checkpointer = new RedisSaver({ client: redis });

/**
 * Hàm kiểm tra kết nối Redis
 */
export async function testRedisConnection(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === "PONG";
    } catch (error) {
        console.error("Redis ping failed:", error);
        return false;
    }
}

/**
 * Hàm xóa session của user (nếu cần)
 */
export async function clearUserSession(userId: string): Promise<void> {
    const pattern = `langgraph:*:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} keys for user ${userId}`);
    }
}
```

**Test Redis connection:**

```bash
# Chạy trong terminal
npx ts-node -e "
const Redis = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6379 });
redis.ping().then(r => { console.log('Redis:', r); process.exit(0); });
"
# Expected: Redis: PONG
```

### ✅ Checklist Phase 1

-   [ ] Đã tạo `models.ts` với 2 model (cheapModel, expertModel)
-   [ ] Đã tạo `state.ts` với AgentState và IntentType
-   [ ] Đã tạo `checkpointer.ts` với Redis connection
-   [ ] Test Redis connection thành công (PONG)

---

## 4. PHASE 2: TẠO CÁC NODE LOGIC

### 4.1. Tạo file `src/services/ai/langgraph/nodes/intent.node.ts`

**Mục đích:** Phân loại ý định người dùng - NODE QUAN TRỌNG NHẤT

**Tạo file:** `langgraph/nodes/intent.node.ts`

````typescript
import { AgentStateType, IntentType } from "../state";
import { cheapModel } from "../models";

/**
 * Intent Node - Phân loại ý định của người dùng
 *
 * Input: messages (tin nhắn cuối cùng)
 * Output: intent, intentReasoning
 *
 * Dùng AI củi vì task đơn giản, tiết kiệm chi phí
 */
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
   
3. "chitchat" - Chào hỏi, cảm ơn, nói chuyện phiếm
   VD: "Chào bạn", "Cảm ơn nhiều", "Tạm biệt"
   
4. "personal_info" - Chia sẻ hoặc hỏi thông tin CÁ NHÂN
   VD: "Tôi tên Cường", "Tôi thích màu xanh", "Tên tôi là gì?"
   
5. "memory_recall" - Hỏi về những gì đã nói TRƯỚC ĐÓ
   VD: "Tôi đã hỏi gì?", "Bạn nhớ tôi nói gì không?"
   
6. "order_check" - Kiểm tra đơn hàng, lịch sử mua
   VD: "Đơn của tôi đến đâu rồi?", "Tôi đã mua gì?"
   
7. "unknown" - Không thuộc các loại trên

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
````

**Test Intent Node riêng:**

Tạo file test tạm `test-intent.ts`:

```typescript
// test-intent.ts (xóa sau khi test)
import { intentNode } from "./src/services/ai/langgraph/nodes/intent.node";
import { HumanMessage } from "@langchain/core/messages";

async function test() {
    const testCases = [
        "iPhone 15 giá bao nhiêu?",
        "Có điện thoại nào?",
        "Chào bạn",
        "Tôi tên Cường",
        "Tên tôi là gì?",
    ];

    for (const msg of testCases) {
        const result = await intentNode({
            messages: [new HumanMessage(msg)],
            longTermSummary: "",
            sqlData: null,
            userId: "test",
            intent: "unknown",
            intentReasoning: "",
            finalResponse: "",
        });
        console.log(`"${msg}" → ${result.intent}`);
    }
}

test();
```

---

### 4.2. Tạo file `src/services/ai/langgraph/nodes/sql.node.ts`

**Mục đích:** Query MySQL theo intent đã phân loại

**Tạo file:** `langgraph/nodes/sql.node.ts`

````typescript
import { AgentStateType } from "../state";
import { ProductService } from "../../../product.service";
import { cheapModel } from "../models";

/**
 * SQL Node - Query MySQL dựa trên intent
 *
 * Logic:
 * - product_query → Extract ID/tên → getProductInfo
 * - product_browse → getAll (limit 5)
 * - order_check → query orders (TODO)
 * - Các intent khác → Skip, return null
 */
export const sqlNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    const productService = new ProductService();
    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = lastMessage.content as string;

    console.log("💾 [SQL Node] Intent:", state.intent);

    try {
        switch (state.intent) {
            case "product_query": {
                // Dùng AI củi để extract thông tin sản phẩm từ câu hỏi
                const extractPrompt = `Trích xuất TÊN hoặc ID sản phẩm từ câu:
"${userMessage}"

Trả về JSON: {"productName": "tên" | null, "productId": số | null}
Chỉ trả JSON, không có text khác.`;

                const extractResult = await cheapModel.invoke(extractPrompt);
                const extracted = JSON.parse(
                    (extractResult.content as string)
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .trim()
                );

                console.log("💾 [SQL Node] Extracted:", extracted);

                // Query theo ID nếu có
                if (extracted.productId) {
                    const data = await productService.getProductInfo(
                        extracted.productId.toString()
                    );
                    return { sqlData: data };
                }

                // Query theo tên (cần implement search trong ProductService)
                if (extracted.productName) {
                    // TODO: Implement searchByName
                    const data = await productService.getProductInfo(
                        userMessage
                    );
                    return { sqlData: data };
                }

                return { sqlData: "Không tìm thấy thông tin sản phẩm." };
            }

            case "product_browse": {
                // Lấy danh sách sản phẩm
                const products = await productService.getAllProducts("vi");

                if (products.length === 0) {
                    return { sqlData: "Hiện tại chưa có sản phẩm nào." };
                }

                // Format top 5 sản phẩm
                const top5 = products.slice(0, 5);
                const summary = top5
                    .map(
                        (p, i) =>
                            `${i + 1}. ${
                                p.name
                            } - ${p.price?.toLocaleString()}đ`
                    )
                    .join("\n");

                return {
                    sqlData: `Có ${products.length} sản phẩm. Top 5:\n${summary}`,
                };
            }

            case "order_check": {
                // TODO: Implement order service
                return {
                    sqlData:
                        "Tính năng kiểm tra đơn hàng đang được phát triển.",
                };
            }

            default:
                // Không cần query SQL
                console.log("💾 [SQL Node] Skipping - no SQL needed");
                return { sqlData: null };
        }
    } catch (error) {
        console.error("❌ [SQL Node] Error:", error);
        return { sqlData: "Lỗi khi truy vấn dữ liệu." };
    }
};
````

---

### 4.3. Tạo file `src/services/ai/langgraph/nodes/memory.node.ts`

**Mục đích:** Load long-term memory từ MongoDB

**Tạo file:** `langgraph/nodes/memory.node.ts`

```typescript
import { AgentStateType } from "../state";
import { MemoryService } from "../../memory.service";

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
```

---

### 4.4. Tạo file `src/services/ai/langgraph/nodes/evaluate.node.ts`

**Mục đích:** AI xịn reasoning và tạo câu trả lời

**Tạo file:** `langgraph/nodes/evaluate.node.ts`

```typescript
import { AgentStateType } from "../state";
import { expertModel } from "../models";
import { AIMessage } from "@langchain/core/messages";

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
```

---

### 4.5. Tạo file `src/services/ai/langgraph/nodes/save.node.ts`

**Mục đích:** Lưu conversation vào MongoDB (long-term)

**Tạo file:** `langgraph/nodes/save.node.ts`

```typescript
import { AgentStateType } from "../state";
import { MemoryService } from "../../memory.service";

/**
 * Save Node - Lưu conversation vào MongoDB
 *
 * Lưu ý:
 * - Short-term (Redis) đã được LangGraph tự động lưu qua checkpointer
 * - Node này chỉ lưu vào MongoDB cho long-term memory
 */
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
```

---

### 4.6. Tạo file index cho nodes `src/services/ai/langgraph/nodes/index.ts`

**Mục đích:** Export tất cả nodes

**Tạo file:** `langgraph/nodes/index.ts`

```typescript
export { intentNode } from "./intent.node";
export { sqlNode } from "./sql.node";
export { memoryNode } from "./memory.node";
export { evaluatorNode } from "./evaluate.node";
export { saveNode } from "./save.node";
```

### ✅ Checklist Phase 2

-   [ ] Đã tạo `intent.node.ts` - Phân loại ý định
-   [ ] Đã tạo `sql.node.ts` - Query SQL theo intent
-   [ ] Đã tạo `memory.node.ts` - Load long-term memory
-   [ ] Đã tạo `evaluate.node.ts` - AI reasoning
-   [ ] Đã tạo `save.node.ts` - Lưu vào MongoDB
-   [ ] Đã tạo `nodes/index.ts` - Export all nodes

---

## 5. PHASE 3: KẾT NỐI GRAPH + CẬP NHẬT SERVICE

### 5.1. Tạo file `src/services/ai/langgraph/index.ts`

**Mục đích:** Build workflow graph và export hàm chat chính

**Tạo file:** `langgraph/index.ts`

```typescript
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
```

---

### 5.2. Cập nhật file `src/services/ai/agent.service.ts`

**Mục đích:** Thay code cũ bằng LangGraph

**Sửa file:** `agent.service.ts`

```typescript
import { chatWithLangGraph, getChatHistory } from "./langgraph";

/**
 * AI Agent Service - Entry point cho AI chat
 *
 * Sử dụng LangGraph với:
 * - Short-term memory (Redis)
 * - Long-term memory (MongoDB)
 * - Intent classification
 * - SQL routing
 */
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
```

---

### 5.3. Cập nhật `memory.service.ts` - Thêm Summarization

**Mục đích:** Tự động tóm tắt khi history quá dài

**Sửa file:** `memory.service.ts`

```typescript
import { VectorService } from "./vector.service";
import MemoryModel from "../../models/ai/memory.schema";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const MAX_HISTORY_ENTRIES = 30; // Giới hạn entries trước khi tóm tắt
const KEEP_RECENT = 10; // Giữ nguyên 10 entries gần nhất

// Model củi cho summarization
const summarizeModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.API_KEY_NORMAL,
    temperature: 0.1,
});

export class MemoryService {
    /**
     * Lưu hoặc cập nhật trí nhớ dài hạn của User - NỐI THÊM + TÓM TẮT
     */
    static async updateMemory(userId: string, newSummary: string) {
        // Tìm memory hiện tại của user
        const existingMemory = await MemoryModel.findOne({
            userId,
            isDeleted: false,
        });

        let combinedSummary: string;

        if (existingMemory && existingMemory.summary) {
            // Tách các entry cũ và thêm entry mới
            let entries = existingMemory.summary
                .split("\n---\n")
                .filter((e) => e.trim());
            entries.push(newSummary);

            // Nếu quá nhiều entries → TÓM TẮT
            if (entries.length > MAX_HISTORY_ENTRIES) {
                console.log("🔄 [Memory] Summarizing old entries...");

                // Tách entries cũ và entries mới
                const oldEntries = entries.slice(0, -KEEP_RECENT);
                const recentEntries = entries.slice(-KEEP_RECENT);

                // Tóm tắt entries cũ
                const summarized = await this.summarizeEntries(oldEntries);

                // Combine: [TÓM TẮT] + entries mới
                combinedSummary = `[TÓM TẮT LỊCH SỬ CŨ]: ${summarized}\n---\n${recentEntries.join(
                    "\n---\n"
                )}`;

                console.log(
                    "🔄 [Memory] Summarized",
                    oldEntries.length,
                    "entries"
                );
            } else {
                combinedSummary = entries.join("\n---\n");
            }
        } else {
            combinedSummary = newSummary;
        }

        // Tạo embedding từ toàn bộ lịch sử
        const embedding = await VectorService.generateEmbedding(
            combinedSummary
        );

        return await MemoryModel.findOneAndUpdate(
            { userId },
            { summary: combinedSummary, embedding, updatedAt: new Date() },
            { upsert: true, new: true }
        );
    }

    /**
     * Tóm tắt nhiều entries thành 1 đoạn ngắn
     */
    static async summarizeEntries(entries: string[]): Promise<string> {
        const prompt = `Tóm tắt lịch sử hội thoại sau thành 2-3 câu ngắn gọn.
CHỈ giữ lại thông tin QUAN TRỌNG: tên khách hàng, sở thích, yêu cầu đặc biệt.

LỊCH SỬ:
${entries.join("\n")}

TÓM TẮT (2-3 câu):`;

        try {
            const response = await summarizeModel.invoke(prompt);
            return response.content as string;
        } catch (error) {
            console.error("❌ [Memory] Summarization failed:", error);
            // Fallback: giữ 5 entries cũ nhất
            return entries.slice(0, 5).join(" | ");
        }
    }

    /**
     * Tìm memory của user (dùng direct query thay vì vector search)
     */
    static async findRelevantMemory(
        userId: string,
        query: string
    ): Promise<string> {
        // Lấy trực tiếp memory của user
        const memory = await MemoryModel.findOne({
            userId: userId,
            isDeleted: false,
        });

        return memory?.summary || "";
    }

    /**
     * Xóa memory của user (soft delete)
     */
    static async clearMemory(userId: string): Promise<void> {
        await MemoryModel.updateOne(
            { userId },
            { isDeleted: true, deletedAt: new Date() }
        );
    }
}
```

### ✅ Checklist Phase 3

-   [ ] Đã tạo `langgraph/index.ts` với workflow graph
-   [ ] Đã cập nhật `agent.service.ts` để dùng LangGraph
-   [ ] Đã cập nhật `memory.service.ts` với summarization
-   [ ] Code compile không lỗi (`npx tsc --noEmit`)

---

## 6. PHASE 4: TEST & DEBUG

### 6.1. Khởi động services

```bash
# Terminal 1: Chạy Docker services
docker-compose up -d

# Kiểm tra services
docker-compose ps
# Expected: mysql, mongodb, redis đều UP

# Terminal 2: Chạy app
npm run dev
```

### 6.2. Test từng chức năng với Postman/cURL

#### Test 1: Intent Classification - Chitchat

```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1", "message": "Chào bạn"}'
```

**Expected:**

-   Console log: `🎯 [Intent Node] Result: {"intent": "chitchat"}`
-   Console log: `🔀 [Router] → memory_load (skip SQL)`
-   Response: Lời chào thân thiện

#### Test 2: Intent Classification - Product Browse

```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1", "message": "Có điện thoại nào?"}'
```

**Expected:**

-   Console log: `🎯 [Intent Node] Result: {"intent": "product_browse"}`
-   Console log: `🔀 [Router] → sql_fetch`
-   Console log: `💾 [SQL Node] Intent: product_browse`
-   Response: Danh sách sản phẩm

#### Test 3: Personal Info - Remember Name

```bash
# Bước 1: Giới thiệu tên
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1", "message": "Tôi tên là Cường"}'

# Bước 2: Hỏi lại tên (CÙNG userId)
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1", "message": "Tên tôi là gì?"}'
```

**Expected:**

-   Response 2: "Anh tên Cường ạ" hoặc tương tự
-   Console log: `🧠 [Memory Node] Found: ...Tôi tên là Cường...`

#### Test 4: Short-term Memory (Redis)

```bash
# Chat nhiều tin liên tiếp
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_2", "message": "Tôi muốn mua iPhone"}'

curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_2", "message": "Giá bao nhiêu?"}'

curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_2", "message": "Tôi đã hỏi gì trước đó?"}'
```

**Expected:**

-   AI nhớ được context từ các tin nhắn trước
-   Response 3 nhắc lại về iPhone

#### Test 5: Kiểm tra Redis

```bash
# Vào Redis CLI
docker exec -it superai-redis redis-cli

# Xem các keys
KEYS *langgraph*

# Xem nội dung 1 key
GET "langgraph:checkpoint:test_user_1:..."
```

#### Test 6: Kiểm tra MongoDB

```javascript
// Trong MongoDB Compass hoặc mongosh
db.memories.find({ userId: "test_user_1" });
```

### 6.3. Debug checklist

| Vấn đề              | Kiểm tra                                  |
| ------------------- | ----------------------------------------- |
| AI không nhớ tên    | Redis đang chạy? Cùng userId?             |
| Intent sai          | Console log intent node                   |
| SQL không query     | Kiểm tra intent có đúng product\_\* không |
| Lỗi kết nối Redis   | `docker logs superai-redis`               |
| Lỗi kết nối MongoDB | Kiểm tra `.env` MONGODB_URI               |

### ✅ Checklist Phase 4

-   [ ] Docker services chạy OK (mysql, mongodb, redis)
-   [ ] App chạy không lỗi (`npm run dev`)
-   [ ] Test chitchat OK
-   [ ] Test product browse OK
-   [ ] Test remember name OK
-   [ ] Test short-term memory OK
-   [ ] Redis có data
-   [ ] MongoDB có data

---

## 7. TROUBLESHOOTING

### 7.1. Lỗi: Cannot find module '@langchain/...'

```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

### 7.2. Lỗi: Redis connection refused

```bash
# Kiểm tra Redis đang chạy
docker-compose ps

# Nếu không chạy
docker-compose up -d redis

# Kiểm tra logs
docker logs superai-redis
```

### 7.3. Lỗi: Intent parse JSON failed

Kiểm tra response từ AI củi có markdown wrapper không:

````typescript
// Trong intent.node.ts, đảm bảo có:
const cleanContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
````

### 7.4. Lỗi: Memory không lưu

```bash
# Kiểm tra MongoDB connection
# Trong mongosh:
use superai
db.memories.find().limit(5)
```

### 7.5. Lỗi: Short-term memory không hoạt động

```bash
# Kiểm tra Redis keys
docker exec -it superai-redis redis-cli KEYS "*"

# Nếu không có keys → checkpointer chưa connect
# Kiểm tra console log: "✅ Redis connected successfully"
```

---

## 8. CHECKLIST TỔNG HỢP

### Phase 0: Chuẩn bị ⬜

-   [ ] `npm install @langchain/google-genai @langchain/langgraph @langchain/langgraph-checkpoint-redis ioredis @langchain/core`
-   [ ] Docker Redis chạy
-   [ ] API keys trong `.env`
-   [ ] Tạo folder `langgraph/` và `langgraph/nodes/`

### Phase 1: Core Files ⬜

-   [ ] `langgraph/models.ts` - 2 AI models
-   [ ] `langgraph/state.ts` - State definition
-   [ ] `langgraph/checkpointer.ts` - Redis checkpointer

### Phase 2: Nodes ⬜

-   [ ] `nodes/intent.node.ts`
-   [ ] `nodes/sql.node.ts`
-   [ ] `nodes/memory.node.ts`
-   [ ] `nodes/evaluate.node.ts`
-   [ ] `nodes/save.node.ts`
-   [ ] `nodes/index.ts`

### Phase 3: Integration ⬜

-   [ ] `langgraph/index.ts` - Workflow graph
-   [ ] `agent.service.ts` - Updated
-   [ ] `memory.service.ts` - Summarization

### Phase 4: Testing ⬜

-   [ ] Test chitchat
-   [ ] Test product browse
-   [ ] Test remember name
-   [ ] Test short-term memory
-   [ ] Verify Redis data
-   [ ] Verify MongoDB data

---

## 📚 TÀI LIỆU THAM KHẢO

-   [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
-   [LangChain Google GenAI](https://js.langchain.com/docs/integrations/chat/google_generativeai)
-   [Redis Checkpointer](https://langchain-ai.github.io/langgraph/how-tos/persistence_redis/)

---

> **Tip:** Bookmark file này và check từng item khi hoàn thành. Good luck! 🚀
