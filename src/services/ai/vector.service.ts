import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ||
        process.env.API_KEY_NORMAL ||
        process.env.API_KEY_PRO ||
        ""
);

export class VectorService {
    /**
     * Biến một đoạn văn bản thành mảng số (Vector)
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = genAI.getGenerativeModel({
                model: "text-embedding-004",
            });
            const result = await model.embedContent(text);
            return result.embedding.values || [];
        } catch (error) {
            console.error("❌ [Vector Service] Embedding error:", error);
            return [];
        }
    }
}
