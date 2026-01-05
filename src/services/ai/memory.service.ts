import { VectorService } from "./vector.service";
import MemoryModel from "../../models/ai/memory.schema";
import { midModel } from "./langgraph/models";

const MAX_HISTORY_ENTRIES = 30; // Giới hạn entries trước khi tóm tắt
const KEEP_RECENT = 10; // Giữ nguyên 10 entries gần nhất

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
            const response = await midModel.invoke(prompt);
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
