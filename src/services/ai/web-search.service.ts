import { tavily } from "@tavily/core";

/**
 * Web Search Service - Search thông tin sản phẩm từ Internet
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

            // Format kết quả
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
