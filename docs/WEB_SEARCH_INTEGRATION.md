# 🌐 TÍCH HỢP WEB SEARCH CHO SO SÁNH SẢN PHẨM

> **Mục tiêu:** So sánh sản phẩm trong DB với sản phẩm ngoài DB (hoặc 2 sản phẩm trong DB)  
> **Use case:** "So sánh iPhone 15 (có trong DB) vs iPhone 16 (chưa có)"

---

## 📋 MỤC LỤC

1. [Chọn Web Search Tool](#1-chọn-web-search-tool)
2. [Setup API Key](#2-setup-api-key)
3. [Cài đặt Dependencies](#3-cài-đặt-dependencies)
4. [Tạo Web Search Service](#4-tạo-web-search-service)
5. [Cập nhật Intent Types](#5-cập-nhật-intent-types)
6. [Tạo Search Node](#6-tạo-search-node)
7. [Update Workflow](#7-update-workflow)
8. [Testing](#8-testing)

---

## 1. CHỌN WEB SEARCH TOOL

### So sánh các options:

| Tool             | Free Tier            | Quality    | Speed      | Cost              |
| ---------------- | -------------------- | ---------- | ---------- | ----------------- |
| **Tavily AI** ⭐ | 1,000 requests/month | ⭐⭐⭐⭐⭐ | Nhanh      | $0/mo (free tier) |
| **Brave Search** | 2,000 queries/month  | ⭐⭐⭐⭐   | Rất nhanh  | $0/mo             |
| **SerpAPI**      | 100 searches/month   | ⭐⭐⭐⭐⭐ | Trung bình | $50/mo (paid)     |
| **DuckDuckGo**   | Unlimited            | ⭐⭐⭐     | Nhanh      | Free              |

**👉 KHUYẾN NGHỊ: Tavily AI** (tối ưu cho AI RAG, free tier tốt)

---

## 2. SETUP API KEY

### Option A: Tavily AI (Khuyến nghị)

**Bước 1:** Đăng ký tại https://tavily.com/

**Bước 2:** Lấy API key từ Dashboard

**Bước 3:** Thêm vào `.env`

```env
# Web Search
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Option B: Brave Search (Alternative)

**Bước 1:** Đăng ký tại https://brave.com/search/api/

**Bước 2:** Thêm vào `.env`

```env
BRAVE_SEARCH_API_KEY=BSAxxxxxxxxxxxxxxxx
```

---

## 3. CÀI ĐẶT DEPENDENCIES

```bash
cd "c:/ha manh cuong/work/superAI"

# Tavily SDK (Khuyến nghị) - Dùng trực tiếp Tavily API
npm install @tavily/core --legacy-peer-deps

# Optional: Axios + Cheerio (cho custom scraping)
npm install axios cheerio
```

> **⚠️ Lưu ý:** Package `@langchain/community/tools/tavily_search` đã deprecated/không ổn định.
> Sử dụng `@tavily/core` trực tiếp để tránh lỗi import và dependency conflicts.

---

## 4. TẠO WEB SEARCH SERVICE

### Tạo file: `src/services/ai/web-search.service.ts`

```typescript
import { tavily } from "@tavily/core";

/**
 * Web Search Service - Search thông tin sản phẩm từ Internet
 * Sử dụng Tavily SDK trực tiếp (không qua LangChain)
 */
export class WebSearchService {
    private static client = tavily({ apiKey: process.env.TAVILY_API_KEY });

    /**
     * Tìm thông tin sản phẩm từ web
     * @param productName - Tên sản phẩm cần search
     * @returns Thông tin sản phẩm (specs, price, reviews...)
     */
    static async searchProduct(productName: string): Promise<string> {
        try {
            console.log("🌐 [Web Search] Searching for:", productName);

            // Tối ưu query cho sản phẩm công nghệ
            const optimizedQuery = `${productName} specifications price features review Vietnam`;

            const response = await this.client.search(optimizedQuery, {
                maxResults: 3,
            });

            if (!response.results || response.results.length === 0) {
                return `Không tìm thấy thông tin về ${productName} trên Internet.`;
            }

            // Format kết quả (không cần JSON.parse - SDK trả về object)
            const formattedResults = response.results
                .map((item: any, index: number) => {
                    return `${index + 1}. ${
                        item.title
                    }\n   ${item.content.substring(0, 200)}...\n   Source: ${
                        item.url
                    }`;
                })
                .join("\n\n");

            console.log("🌐 [Web Search] Found results");
            return formattedResults;
        } catch (error) {
            console.error("❌ [Web Search] Error:", error);
            return `Lỗi khi tìm kiếm thông tin về ${productName}.`;
        }
    }

    /**
     * Tìm thông tin chi tiết (specs, giá) của sản phẩm
     */
    static async getProductSpecs(productName: string): Promise<string> {
        const query = `${productName} specifications features price`;

        try {
            const response = await this.client.search(query, { maxResults: 3 });

            if (!response.results) return "Không tìm thấy thông tin";

            return response.results
                .map((r: any) => r.content)
                .join("\n")
                .substring(0, 1000); // Limit to 1000 chars
        } catch (error) {
            return "Không tìm thấy thông tin";
        }
    }

    /**
     * So sánh 2 sản phẩm
     */
    static async compareProducts(
        product1: string,
        product2: string
    ): Promise<string> {
        const query = `${product1} vs ${product2} comparison specs price`;

        try {
            const response = await this.client.search(query, { maxResults: 3 });

            return response.results
                .map((r: any) => `${r.title}\n${r.content}`)
                .join("\n\n")
                .substring(0, 2000);
        } catch (error) {
            // Fallback: Search riêng từng sản phẩm
            const specs1 = await this.getProductSpecs(product1);
            const specs2 = await this.getProductSpecs(product2);

            return `Thông tin ${product1}:\n${specs1}\n\nThông tin ${product2}:\n${specs2}`;
        }
    }
}
```

### Điểm khác biệt so với LangChain wrapper:

| Aspect    | `@langchain/community` (cũ)      | `@tavily/core` (mới)      |
| --------- | -------------------------------- | ------------------------- |
| Import    | `TavilySearchResults`            | `tavily`                  |
| Init      | `new TavilySearchResults({...})` | `tavily({ apiKey })`      |
| Call      | `.invoke(query)`                 | `.search(query, options)` |
| Response  | JSON string (cần parse)          | Object (dùng trực tiếp)   |
| Stability | ⚠️ Hay lỗi import                | ✅ Ổn định                |

---

## 5. CẬP NHẬT INTENT TYPES

### File: `src/services/ai/langgraph/state.ts`

```typescript
export type IntentType =
    | "product_query"
    | "product_browse"
    | "product_compare" // ← MỚI: So sánh sản phẩm
    | "chitchat"
    | "personal_info"
    | "memory_recall"
    | "order_check"
    | "unknown";
```

### File: `src/services/ai/langgraph/nodes/intent.node.ts`

Thêm vào prompt:

```typescript
const prompt = `...

CÁC LOẠI INTENT:
...

8. "product_compare" - SO SÁNH 2 hoặc nhiều sản phẩm
   VD: "So sánh iPhone 15 và Samsung S23", "iPhone 15 vs iPhone 16"
   
...`;
```

---

## 6. TẠO SEARCH NODE

### File: `src/services/ai/langgraph/nodes/search.node.ts`

````typescript
import { AgentStateType } from "../state";
import { WebSearchService } from "../../../web-search.service";
import { ProductService } from "../../../product.service";
import { cheapModel } from "../models";

/**
 * Search Node - Tìm kiếm thông tin từ Web hoặc Database
 *
 * Logic:
 * - product_compare → Extract tên sản phẩm → Search web cho sản phẩm không có trong DB
 */
export const searchNode = async (
    state: AgentStateType
): Promise<Partial<AgentStateType>> => {
    const productService = new ProductService();
    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = lastMessage.content as string;

    console.log("🔍 [Search Node] Intent:", state.intent);

    try {
        if (state.intent === "product_compare") {
            // ═══════════════════════════════════════════════════
            // BƯỚC 1: Extract tên các sản phẩm cần so sánh
            // ═══════════════════════════════════════════════════
            const extractPrompt = `Trích xuất TÊN CÁC SẢN PHẨM cần so sánh từ câu:
"${userMessage}"

Trả về JSON:
{
    "products": ["tên sản phẩm 1", "tên sản phẩm 2", ...]
}

Ví dụ:
- "So sánh iPhone 15 và Samsung S23" → {"products": ["iPhone 15", "Samsung S23"]}
- "iPhone 15 vs iPhone 16 ai tốt hơn" → {"products": ["iPhone 15", "iPhone 16"]}

Chỉ trả JSON, không text khác.`;

            const extractResult = await cheapModel.invoke(extractPrompt);
            const extracted = JSON.parse(
                (extractResult.content as string)
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim()
            );

            console.log(
                "🔍 [Search Node] Products to compare:",
                extracted.products
            );

            if (!extracted.products || extracted.products.length < 2) {
                return {
                    sqlData: "Vui lòng cho biết tên 2 sản phẩm cần so sánh.",
                };
            }

            // ═══════════════════════════════════════════════════
            // BƯỚC 2: Kiểm tra sản phẩm nào có trong DB
            // ═══════════════════════════════════════════════════
            const allProducts = await productService.getAllProducts("vi");
            const productInfos: {
                name: string;
                source: string;
                data: string;
            }[] = [];

            for (const productName of extracted.products) {
                // Fuzzy match trong DB
                const fuzzyPrompt = `Tìm sản phẩm KHỚP với "${productName}" trong danh sách:
${allProducts.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}

Trả về JSON: {"matchedIndex": số | null}
Chỉ JSON, không text khác.`;

                const fuzzyResult = await cheapModel.invoke(fuzzyPrompt);
                const fuzzyMatch = JSON.parse(
                    (fuzzyResult.content as string)
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .trim()
                );

                if (fuzzyMatch.matchedIndex !== null) {
                    // ✅ Có trong DB
                    const product = allProducts[fuzzyMatch.matchedIndex];
                    productInfos.push({
                        name: productName,
                        source: "database",
                        data: `${product.name}: ${
                            product.description
                        }, Giá: ${product.price?.toLocaleString()}đ`,
                    });
                    console.log(`✅ [Search Node] ${productName} found in DB`);
                } else {
                    // ❌ KHÔNG có trong DB → Search Web
                    console.log(
                        `🌐 [Search Node] ${productName} NOT in DB, searching web...`
                    );
                    const webData = await WebSearchService.getProductSpecs(
                        productName
                    );
                    productInfos.push({
                        name: productName,
                        source: "web",
                        data: `${productName} (từ Internet):\n${webData}`,
                    });
                }
            }

            // ═══════════════════════════════════════════════════
            // BƯỚC 3: Tổng hợp kết quả
            // ═══════════════════════════════════════════════════
            const summary = productInfos
                .map((info) => {
                    const emoji = info.source === "database" ? "💾" : "🌐";
                    return `${emoji} ${info.data}`;
                })
                .join("\n\n");

            return {
                sqlData: `Thông tin để so sánh:\n\n${summary}`,
            };
        }

        // Các intent khác không cần search
        return { sqlData: null };
    } catch (error) {
        console.error("❌ [Search Node] Error:", error);
        return { sqlData: "Lỗi khi tìm kiếm thông tin." };
    }
};
````

### Export node mới: `src/services/ai/langgraph/nodes/index.ts`

```typescript
export { intentNode } from "./intent.node";
export { sqlNode } from "./sql.node";
export { searchNode } from "./search.node"; // ← MỚI
export { memoryNode } from "./memory.node";
export { evaluatorNode } from "./evaluate.node";
export { saveNode } from "./save.node";
```

---

## 7. UPDATE WORKFLOW

### File: `src/services/ai/langgraph/index.ts`

```typescript
import {
    intentNode,
    sqlNode,
    searchNode, // ← MỚI
    memoryNode,
    evaluatorNode,
    saveNode,
} from "./nodes";

// Cập nhật router
function shouldFetchSQL(state: AgentStateType): string {
    const needSQL = ["product_query", "product_browse", "order_check"];
    const needSearch = ["product_compare"]; // ← MỚI

    if (needSQL.includes(state.intent)) {
        console.log("🔀 [Router] → sql_fetch");
        return "sql_fetch";
    }

    if (needSearch.includes(state.intent)) {
        console.log("🔀 [Router] → web_search"); // ← MỚI
        return "web_search";
    }

    console.log("🔀 [Router] → memory_load (skip SQL)");
    return "memory_load";
}

// Cập nhật workflow
const workflow = new StateGraph(AgentState)
    .addNode("intent_classify", intentNode)
    .addNode("sql_fetch", sqlNode)
    .addNode("web_search", searchNode) // ← MỚI
    .addNode("memory_load", memoryNode)
    .addNode("evaluate", evaluatorNode)
    .addNode("save_memory", saveNode)

    .addEdge(START, "intent_classify")

    // Conditional routing
    .addConditionalEdges("intent_classify", shouldFetchSQL, {
        sql_fetch: "sql_fetch",
        web_search: "web_search", // ← MỚI
        memory_load: "memory_load",
    })

    // Flow
    .addEdge("sql_fetch", "memory_load")
    .addEdge("web_search", "memory_load") // ← MỚI: Search → Memory → Evaluate
    .addEdge("memory_load", "evaluate")
    .addEdge("evaluate", "save_memory")
    .addEdge("save_memory", END);
```

---

## 8. TESTING

### Test Case 1: So sánh 2 sản phẩm TRONG DB

```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test001",
    "message": "So sánh iPhone 15 và Samsung S23"
  }'
```

**Expected Flow:**

```
🎯 [Intent Node] → product_compare
🔀 [Router] → web_search
🔍 [Search Node] Products to compare: ["iPhone 15", "Samsung S23"]
✅ [Search Node] iPhone 15 found in DB
✅ [Search Node] Samsung S23 found in DB
💾 Thông tin từ database
🤖 [Evaluator] So sánh 2 sản phẩm...
```

---

### Test Case 2: So sánh sản phẩm TRONG DB vs NGOÀI DB

```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test001",
    "message": "So sánh iPhone 15 vs iPhone 16"
  }'
```

**Expected Flow:**

```
🎯 [Intent Node] → product_compare
🔀 [Router] → web_search
🔍 [Search Node] Products to compare: ["iPhone 15", "iPhone 16"]
✅ [Search Node] iPhone 15 found in DB
🌐 [Search Node] iPhone 16 NOT in DB, searching web...
🌐 [Web Search] Searching for: iPhone 16
💾 iPhone 15: từ database
🌐 iPhone 16: từ Internet (specs, giá...)
🤖 [Evaluator] So sánh...
```

---

### Test Case 3: Hỏi thông tin sản phẩm NGOÀI DB

```bash
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test001",
    "message": "iPhone 16 có những tính năng gì mới?"
  }'
```

**Flow:**

```
🎯 [Intent Node] → product_query
🔀 [Router] → sql_fetch
💾 [SQL Node] Extract: "iPhone 16"
💾 [SQL Node] Tier 2: Fuzzy search → NOT FOUND
💾 [SQL Node] Tier 3: Recommendation (hoặc thêm web search fallback)
```

---

## 9. ADVANCED: FALLBACK TO WEB SEARCH

### Cập nhật `sql.node.ts` để fallback sang web search

```typescript
// Trong sql.node.ts - Case product_query
// Sau Tier 3 (Smart Recommendation)

if (recommendedProducts.length === 0) {
    // ═══════════════════════════════════════
    // TIER 4: WEB SEARCH FALLBACK
    // Sản phẩm không có trong DB → Search web
    // ═══════════════════════════════════════
    console.log("🌐 [SQL Node] Tier 4: Web search fallback");

    const webData = await WebSearchService.getProductSpecs(
        extracted.productName
    );

    return {
        sqlData: `Sản phẩm "${extracted.productName}" không có trong kho.\n\nThông tin từ Internet:\n${webData}`,
    };
}
```

---

## 10. MONITORING & OPTIMIZATION

### Thêm logging để track web search usage

```typescript
// src/services/ai/web-search.service.ts

static async searchProduct(productName: string): Promise<string> {
    const startTime = Date.now();

    try {
        const response = await this.client.search(optimizedQuery, {
            maxResults: 3,
        });

        const duration = Date.now() - startTime;
        console.log(`🌐 [Web Search] Completed in ${duration}ms`);
        console.log(`🌐 [Web Search] Results count: ${response.results?.length || 0}`);

        // Optional: Log to DB for analytics
        // await logSearchUsage({ query: productName, duration, resultsCount: response.results?.length });

        return formattedResults;
    } catch (error) {
        // ...
    }
}
```

---

## 11. COST OPTIMIZATION

### Caching Web Search Results

```typescript
// src/services/ai/web-search.service.ts

import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

export class WebSearchService {
    private static client = tavily({ apiKey: process.env.TAVILY_API_KEY });
    private static cache = new NodeCache({
        stdTTL: 3600, // 1 hour
        checkperiod: 600,
    });

    static async searchProduct(productName: string): Promise<string> {
        // Check cache first
        const cached = this.cache.get<string>(productName);
        if (cached) {
            console.log("💾 [Web Search] Cache hit:", productName);
            return cached;
        }

        // Search với Tavily SDK
        const optimizedQuery = `${productName} specifications price features review Vietnam`;
        const response = await this.client.search(optimizedQuery, {
            maxResults: 3,
        });

        const formattedResults = response.results
            .map(
                (item: any, index: number) =>
                    `${index + 1}. ${item.title}\n   ${item.content.substring(
                        0,
                        200
                    )}...\n   Source: ${item.url}`
            )
            .join("\n\n");

        // Cache results
        this.cache.set(productName, formattedResults);

        return formattedResults;
    }
}
```

**Cài đặt:**

```bash
npm install node-cache --legacy-peer-deps
```

---

## 📊 CHECKLIST TỔNG HỢP

### Phase 1: Setup

-   [ ] Đăng ký Tavily API key tại https://tavily.com/
-   [ ] Thêm `TAVILY_API_KEY` vào `.env`
-   [ ] `npm install @tavily/core --legacy-peer-deps`

### Phase 2: Code

-   [ ] Tạo `web-search.service.ts`
-   [ ] Cập nhật `state.ts` (thêm `product_compare`)
-   [ ] Cập nhật `intent.node.ts` (detect compare)
-   [ ] Tạo `search.node.ts`
-   [ ] Cập nhật `index.ts` (workflow + router)

### Phase 3: Testing

-   [ ] Test so sánh 2 sản phẩm TRONG DB
-   [ ] Test so sánh sản phẩm TRONG vs NGOÀI DB
-   [ ] Test hỏi sản phẩm NGOÀI DB

### Phase 4: Optimization (Optional)

-   [ ] Implement caching
-   [ ] Thêm web search fallback cho product_query
-   [ ] Add usage analytics

---

## 🎯 KẾT LUẬN

**Sau khi hoàn thành:**
✅ AI có thể so sánh sản phẩm TRONG DB với sản phẩm NGOÀI DB  
✅ Tự động search web khi sản phẩm không có trong database  
✅ Kết hợp data từ MySQL + Internet cho response chính xác  
✅ Tiết kiệm chi phí với caching và fallback logic

**Use cases được giải quyết:**

-   "So sánh iPhone 15 (có trong DB) vs iPhone 16 (chưa có)"
-   "Galaxy S24 Ultra có gì mới?" (search web nếu chưa có)
-   "iPhone 15 vs Samsung S23" (cả 2 trong DB)

---

**Next Steps:** Bắt đầu từ Phase 1 - Setup API key! 🚀
