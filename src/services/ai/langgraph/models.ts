import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Model Củi (Worker) - Dùng cho các task đơn giản
 * - Gemini 1.5 Flash: Rẻ, nhanh
 * - Dùng cho: Intent classification, extract data, summarization
 */
export const cheapModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1, // Ít sáng tạo, chính xác hơn
});

export const midModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.5, // Sáng tạo vừa phải
});
export const expertModel = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7, // Sáng tạo vừa phải
});
// async function testModels() {
//     console.log("Testing expertModel...");
//     const expert = await expertModel.invoke("Xin chào");
//     console.log("ExpertModel:", expert.content);
// }

// testModels();
