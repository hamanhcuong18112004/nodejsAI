# 🚨 GOOGLE GENERATIVE AI - ERROR CODES & TROUBLESHOOTING

> **Tài liệu**: Các loại lỗi thường gặp khi sử dụng Google Gemini API  
> **Cập nhật**: 05/01/2026

---

## 📋 MỤC LỤC

1. [HTTP Status Codes](#1-http-status-codes)
2. [Common Error Types](#2-common-error-types)
3. [Error Handling Strategy](#3-error-handling-strategy)
4. [Troubleshooting Guide](#4-troubleshooting-guide)
5. [Code Examples](#5-code-examples)

---

## 1. HTTP STATUS CODES

### ✅ Success (2xx)

| Code    | Status  | Ý nghĩa                              |
| ------- | ------- | ------------------------------------ |
| **200** | OK      | Request thành công, có response data |
| **201** | Created | Resource được tạo thành công         |

---

### ⚠️ Client Errors (4xx)

#### **400 - Bad Request**

```json
{
    "error": {
        "code": 400,
        "message": "Invalid request",
        "status": "INVALID_ARGUMENT"
    }
}
```

**Nguyên nhân:**

-   Request body không đúng format JSON
-   Thiếu required fields
-   Tham số không hợp lệ (temperature > 2.0, top_k < 0...)
-   Prompt quá dài (vượt max tokens)

**Cách fix:**

```typescript
// ❌ SAI
const response = await model.invoke({
    temperature: 3.0, // Vượt giới hạn
});

// ✅ ĐÚNG
const response = await model.invoke({
    temperature: 0.7, // 0.0 - 2.0
});
```

---

#### **401 - Unauthorized**

```json
{
    "error": {
        "code": 401,
        "message": "Request is missing required authentication credential",
        "status": "UNAUTHENTICATED"
    }
}
```

**Nguyên nhân:**

-   Thiếu API key
-   API key sai hoặc đã expire

**Cách fix:**

```typescript
// Kiểm tra .env
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("❌ Missing GEMINI_API_KEY in .env");
}

const model = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: "gemini-1.5-flash",
});
```

---

#### **403 - Forbidden**

```json
{
    "error": {
        "code": 403,
        "message": "Method doesn't allow unregistered callers",
        "status": "PERMISSION_DENIED"
    }
}
```

**Nguyên nhân:**

-   API key không có quyền truy cập model này
-   API key chưa enable Gemini API
-   IP bị block
-   Billing chưa setup (paid tier)

**Cách fix:**

1. Enable Gemini API tại: https://makersuite.google.com/app/apikey
2. Kiểm tra API Restrictions trong Google Cloud Console
3. Verify API key có quyền:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

---

#### **404 - Not Found**

```json
{
    "error": {
        "code": 404,
        "message": "models/gemini-3.0-flash is not found",
        "status": "NOT_FOUND"
    }
}
```

**Nguyên nhân:**

-   Model name sai
-   Model chưa available cho API key của bạn
-   Typo trong tên model

**Cách fix:**

```typescript
// ❌ SAI - Model không tồn tại
model: "gemini-3.0-flash";
model: "gemini-3.9-flash";

// ✅ ĐÚNG - Models hiện có
model: "gemini-1.5-flash"; // Stable
model: "gemini-1.5-pro"; // High quality
model: "gemini-2.0-flash-exp"; // Experimental
```

**Danh sách models hợp lệ:**

-   `gemini-1.5-flash` (stable, nhanh)
-   `gemini-1.5-pro` (stable, chất lượng cao)
-   `gemini-2.0-flash-exp` (experimental)
-   `text-embedding-004` (embeddings)

---

#### **429 - Too Many Requests**

```json
{
    "error": {
        "code": 429,
        "message": "Resource has been exhausted",
        "status": "RESOURCE_EXHAUSTED"
    }
}
```

**Nguyên nhân:**

-   Vượt quota/rate limit
    -   Free tier: **15 requests/minute** (RPM)
    -   Free tier: **1,500 requests/day** (RPD)
    -   Paid tier: Tùy plan

**Cách fix:**

**1. Implement Retry Logic:**

```typescript
async function callWithRetry(fn: Function, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (error.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // Exponential backoff
                console.log(`⏳ Rate limit hit. Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

// Sử dụng
const response = await callWithRetry(() => model.invoke(prompt));
```

**2. Implement Queue:**

```typescript
import PQueue from "p-queue";

const queue = new PQueue({
    concurrency: 1,
    interval: 4000, // 4 giây
    intervalCap: 1, // 1 request mỗi 4s = 15 RPM
});

async function queuedInvoke(prompt: string) {
    return queue.add(() => model.invoke(prompt));
}
```

**3. Multiple API Keys Rotation:**

```typescript
const keys = [KEY1, KEY2, KEY3];
let currentKeyIndex = 0;

function getNextKey() {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return keys[currentKeyIndex];
}
```

---

### 🔥 Server Errors (5xx)

#### **500 - Internal Server Error**

```json
{
    "error": {
        "code": 500,
        "message": "An internal error has occurred",
        "status": "INTERNAL"
    }
}
```

**Nguyên nhân:**

-   Lỗi từ Google servers
-   Model đang maintenance
-   Prompt gây crash model (rare)

**Cách fix:**

-   Retry sau 5-10 giây
-   Nếu lỗi persist → Report tại [Google AI Forum](https://discuss.ai.google.dev/)

---

#### **503 - Service Unavailable**

```json
{
    "error": {
        "code": 503,
        "message": "The service is currently unavailable",
        "status": "UNAVAILABLE"
    }
}
```

**Nguyên nhân:**

-   Model overloaded
-   Planned maintenance
-   Regional outage

**Cách fix:**

-   Retry với exponential backoff
-   Switch sang model khác (fallback)

---

## 2. COMMON ERROR TYPES

### 🔴 **SAFETY_SETTINGS** Error

```json
{
    "error": {
        "code": 400,
        "message": "Request was blocked due to safety concerns"
    }
}
```

**Nguyên nhân:**

-   Prompt chứa nội dung nhạy cảm
-   Response tự động filter

**Cách fix:**

```typescript
const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    safetySettings: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH", // Chỉ block nội dung rất nghiêm trọng
        },
    ],
});
```

---

### 🔴 **CONTEXT_LENGTH_EXCEEDED** Error

```json
{
    "error": {
        "code": 400,
        "message": "Request exceeds maximum context length"
    }
}
```

**Giới hạn:**

-   `gemini-1.5-flash`: **1M tokens** (input + output)
-   `gemini-1.5-pro`: **2M tokens**

**Cách fix:**

```typescript
// Truncate prompt
function truncatePrompt(text: string, maxChars = 30000) {
    if (text.length > maxChars) {
        return text.substring(0, maxChars) + "...[truncated]";
    }
    return text;
}
```

---

### 🔴 **INVALID_API_KEY** Error

```
GoogleGenerativeAIError: [400 Bad Request] API key not valid
```

**Nguyên nhân:**

-   API key format sai
-   API key đã bị revoke
-   Copy thiếu ký tự

**Cách fix:**

```bash
# Kiểm tra format API key
# Gemini API key format: AIzaSy...  (39 ký tự)
echo $GEMINI_API_KEY | wc -c  # Should be 40 (39 + newline)
```

---

## 3. ERROR HANDLING STRATEGY

### Best Practices

```typescript
import { GoogleGenerativeAIError } from "@google/generative-ai";

async function safeInvoke(model: any, prompt: string) {
    try {
        const response = await model.invoke(prompt);
        return response.content;
    } catch (error: any) {
        // Type guard
        if (error instanceof GoogleGenerativeAIError) {
            switch (error.status) {
                case 400:
                    console.error("❌ Invalid request:", error.message);
                    return "Xin lỗi, yêu cầu không hợp lệ.";

                case 401:
                case 403:
                    console.error("❌ Auth error:", error.message);
                    throw new Error("API configuration error. Contact admin.");

                case 404:
                    console.error("❌ Model not found:", error.message);
                    return "Model không khả dụng. Thử lại sau.";

                case 429:
                    console.error("⏳ Rate limit. Waiting...");
                    await new Promise((r) => setTimeout(r, 5000));
                    return safeInvoke(model, prompt); // Retry

                case 500:
                case 503:
                    console.error("🔥 Server error. Retrying...");
                    await new Promise((r) => setTimeout(r, 3000));
                    return safeInvoke(model, prompt); // Retry once

                default:
                    console.error("❌ Unknown error:", error);
                    return "Đã có lỗi xảy ra. Vui lòng thử lại.";
            }
        }

        // Network errors
        if (error.code === "ECONNREFUSED") {
            return "Không thể kết nối. Kiểm tra internet.";
        }

        throw error; // Unhandled errors
    }
}
```

---

## 4. TROUBLESHOOTING GUIDE

### ❓ Checklist khi gặp lỗi

```bash
# 1. Kiểm tra API key
echo $GEMINI_API_KEY

# 2. Test API key
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: YOUR_KEY"

# 3. Kiểm tra quota
# → Google AI Studio > Usage: https://aistudio.google.com/app/apikey

# 4. Verify model name
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: YOUR_KEY" \
  | jq '.models[].name'

# 5. Check network
ping generativelanguage.googleapis.com
```

---

### 🔍 Debug Mode

```typescript
// Enable debug logging
const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    verbose: true, // ← Enable debug
});

// Log requests
import axios from "axios";
axios.interceptors.request.use((req) => {
    console.log("🚀 Request:", req.url, req.data);
    return req;
});
```

---

## 5. CODE EXAMPLES

### Robust Error Handler

```typescript
// src/utils/gemini-error-handler.ts
export class GeminiErrorHandler {
    static handle(error: any): string {
        const statusCode = error.status || error.response?.status;

        const errorMap: Record<number, string> = {
            400: "Yêu cầu không hợp lệ. Vui lòng thử lại.",
            401: "Xác thực thất bại. Liên hệ quản trị viên.",
            403: "Không có quyền truy cập. Liên hệ quản trị viên.",
            404: "Model không tồn tại.",
            429: "Vượt giới hạn request. Vui lòng chờ.",
            500: "Lỗi server. Thử lại sau.",
            503: "Service đang bảo trì. Thử lại sau.",
        };

        return errorMap[statusCode] || "Đã có lỗi. Vui lòng thử lại.";
    }

    static shouldRetry(error: any): boolean {
        const retryableCodes = [429, 500, 503];
        return retryableCodes.includes(error.status);
    }
}

// Sử dụng
try {
    const response = await model.invoke(prompt);
} catch (error) {
    const userMessage = GeminiErrorHandler.handle(error);

    if (GeminiErrorHandler.shouldRetry(error)) {
        await sleep(5000);
        // Retry logic
    }

    return userMessage;
}
```

---

### Rate Limiter Middleware

```typescript
// src/middleware/rate-limiter.ts
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
    points: 15, // 15 requests
    duration: 60, // per 60 seconds
});

export async function checkRateLimit(userId: string) {
    try {
        await rateLimiter.consume(userId);
        return true;
    } catch (error) {
        throw new Error("Rate limit exceeded. Wait 1 minute.");
    }
}

// Trong controller
app.post("/api/chat", async (req, res) => {
    try {
        await checkRateLimit(req.body.userId);
        const response = await aiService.chat(req.body.message);
        res.json(response);
    } catch (error: any) {
        if (error.message.includes("Rate limit")) {
            res.status(429).json({ error: error.message });
        }
    }
});
```

---

## 📚 TÀI LIỆU THAM KHẢO

-   [Gemini API Error Codes](https://ai.google.dev/gemini-api/docs/troubleshooting)
-   [Google Cloud Error Types](https://cloud.google.com/apis/design/errors)
-   [Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/quota)

---

## 🎯 QUICK REFERENCE

| Lỗi                 | Code | Fix nhanh                |
| ------------------- | ---- | ------------------------ |
| API key sai         | 401  | Kiểm tra `.env`          |
| Model không tồn tại | 404  | Đổi model name           |
| Vượt rate limit     | 429  | Thêm delay giữa requests |
| Prompt quá dài      | 400  | Truncate prompt          |
| Server error        | 500  | Retry sau 5s             |

---

> **Pro tip:** Luôn wrap AI calls trong try-catch và có fallback response cho user!
