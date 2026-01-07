import { ProductService } from "../../../product.service";
import { WebSearchService } from "../../web-search.service";
import { cheapModel } from "../models";
import { AgentStateType } from "../state";

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
            const extractPrompt = `Trích xuất TÊN ĐẦY ĐỦ các sản phẩm cần so sánh từ câu:
"${userMessage}"

QUAN TRỌNG: 
- Trích xuất TÊN ĐẦY ĐỦ, KHÔNG rút gọn
- Nếu gặp "iPhone 15 vs 16" → trả về ["iPhone 15", "iPhone 16"]
- Nếu gặp "A vs B chi tiết" → trả về ["A", "B"]

Trả về JSON:
{
    "products": ["tên đầy đủ sản phẩm 1", "tên đầy đủ sản phẩm 2", ...]
}

Ví dụ:
- "So sánh iPhone 15 và Samsung S23" → {"products": ["iPhone 15", "Samsung S23"]}
- "iPhone 15 vs iPhone 16 ai tốt hơn" → {"products": ["iPhone 15", "iPhone 16"]}
- "So sánh iPad Pro vs Air" → {"products": ["iPad Pro", "iPad Air"]}

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
                // Fuzzy match trong DB (CHẶT CHẼ - không đoán bừa)
                const fuzzyPrompt = `Tìm sản phẩm KHỚP CHÍNH XÁC với "${productName}" trong danh sách:
${allProducts.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}

QUY TẮC:
- Chỉ trả về index nếu tên SẢN PHẨM KHỚP (ví dụ: "iPhone 15" khớp với "iPhone 15 Pro Max")
- Nếu KHÔNG CHẮC CHẮN → trả về null
- "16" KHÔNG khớp với bất kỳ sản phẩm nào
- "Samsung" KHÔNG khớp nếu không có model cụ thể

Trả về JSON: {"matchedIndex": số hoặc null, "confidence": "high" | "low"}
Chỉ JSON, không text khác.`;

                const fuzzyResult = await cheapModel.invoke(fuzzyPrompt);
                const fuzzyMatch = JSON.parse(
                    (fuzzyResult.content as string)
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .trim()
                );

                // Chỉ chấp nhận nếu confidence = high
                if (
                    fuzzyMatch.matchedIndex !== null &&
                    fuzzyMatch.confidence === "high"
                ) {
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
