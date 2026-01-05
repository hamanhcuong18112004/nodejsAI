import "dotenv/config";
import { HumanMessage } from "@langchain/core/messages";
import { intentNode } from "./intent.node";

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
