import { ProductService } from "../../../product.service";
import { cheapModel } from "../models";
import { AgentStateType } from "../state";

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
                // ═══════════════════════════════════════
                // STEP 1: Extract thông tin từ câu hỏi
                // ═══════════════════════════════════════
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

                // ═══════════════════════════════════════
                // TIER 1: EXACT MATCH - Query theo ID
                // ═══════════════════════════════════════
                if (extracted.productId) {
                    console.log(
                        "🎯 [SQL Node] Tier 1: Exact ID match -",
                        extracted.productId
                    );
                    const data = await productService.getProductInfo(
                        extracted.productId.toString()
                    );
                    if (data && !data.includes("không tìm thấy")) {
                        return { sqlData: data };
                    }
                }

                // ═══════════════════════════════════════
                // TIER 2: FUZZY SEARCH - Tìm tương tự bằng AI
                // ═══════════════════════════════════════
                if (extracted.productName) {
                    console.log(
                        "🔍 [SQL Node] Tier 2: Fuzzy search -",
                        extracted.productName
                    );

                    // Lấy TẤT CẢ sản phẩm
                    const allProducts = await productService.getAllProducts(
                        "vi"
                    );

                    if (allProducts.length === 0) {
                        return {
                            sqlData: "Hiện tại chưa có sản phẩm nào.",
                        };
                    }

                    // Dùng AI để tìm sản phẩm khớp nhất (fuzzy matching)
                    const fuzzyPrompt = `Tìm sản phẩm KHỚP NHẤT với từ khóa: "${
                        extracted.productName
                    }"

DANH SÁCH SẢN PHẨM:
${allProducts
    .map(
        (p: any, i) =>
            `${i + 1}. ID: ${p.id} | Tên: ${
                p.name
            } | Giá: ${p.price?.toLocaleString()}đ`
    )
    .join("\n")}

YÊU CẦU:
1. Tìm sản phẩm CÓ TÊN GIỐNG NHẤT (chấp nhận typo, viết tắt, không dấu)
2. Nếu KHÔNG CÓ SẢN PHẨM NÀO GIỐNG → Trả về null
3. Nếu CÓ → Trả về ID của sản phẩm đó

VÍ DỤ:
- "iphone" → Khớp với "iPhone 15"
- "dien thoai samsung" → Khớp với "Samsung Galaxy S23"
- "may tinh" → null (quá chung chung)

TRẢ VỀ JSON: {"matchedProductId": số | null, "confidence": "high" | "low"}
Chỉ JSON, không text khác.`;

                    const fuzzyResult = await cheapModel.invoke(fuzzyPrompt);
                    const fuzzyMatch = JSON.parse(
                        (fuzzyResult.content as string)
                            .replace(/```json\n?/g, "")
                            .replace(/```\n?/g, "")
                            .trim()
                    );

                    console.log("🔍 [SQL Node] Fuzzy result:", fuzzyMatch);

                    // Nếu tìm thấy với confidence cao
                    if (
                        fuzzyMatch.matchedProductId &&
                        fuzzyMatch.confidence === "high"
                    ) {
                        const matchedProduct = allProducts.find(
                            (p: any) => p.id === fuzzyMatch.matchedProductId
                        );
                        if (matchedProduct) {
                            return {
                                sqlData: `Sản phẩm: ${
                                    matchedProduct.name
                                }, Mô tả: ${
                                    matchedProduct.description
                                }, Giá: ${matchedProduct.price?.toLocaleString()} VND.`,
                            };
                        }
                    }

                    // ═══════════════════════════════════════
                    // TIER 3: SMART RECOMMENDATION
                    // Không tìm thấy chính xác → Đề xuất 5 sản phẩm tương tự
                    // ═══════════════════════════════════════
                    console.log("💡 [SQL Node] Tier 3: Smart recommendation");

                    const recommendPrompt = `Khách hàng tìm: "${
                        extracted.productName
                    }"

DANH SÁCH SẢN PHẨM:
${allProducts
    .map((p, i) => `${i + 1}. ${p.name} - ${p.price?.toLocaleString()}đ`)
    .join("\n")}

Chọn TOP 5 sản phẩm LIÊN QUAN NHẤT với từ khóa trên.
TRẢ VỀ JSON: {"recommendedIds": [id1, id2, id3, id4, id5]}
Chỉ JSON, không text khác.`;

                    const recommendResult = await cheapModel.invoke(
                        recommendPrompt
                    );
                    const recommendations = JSON.parse(
                        (recommendResult.content as string)
                            .replace(/```json\n?/g, "")
                            .replace(/```\n?/g, "")
                            .trim()
                    );

                    const recommendedProducts = allProducts
                        .filter((p: any) =>
                            recommendations.recommendedIds.includes(p.id)
                        )
                        .slice(0, 5);

                    if (recommendedProducts.length > 0) {
                        const summary = recommendedProducts
                            .map(
                                (p, i) =>
                                    `${i + 1}. ${
                                        p.name
                                    } - ${p.price?.toLocaleString()}đ`
                            )
                            .join("\n");

                        return {
                            sqlData: `Không tìm thấy sản phẩm chính xác "${extracted.productName}".\n\nCó thể bạn đang tìm:\n${summary}`,
                        };
                    }
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
