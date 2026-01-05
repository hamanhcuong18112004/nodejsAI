# SuperAI Backend - Node.js + Express + TypeScript

Backend chuẩn chỉnh với kiến trúc MVC, sử dụng Node.js, Express và TypeScript.

## 📁 Cấu trúc thư mục

```
src/
├── config/              # Configuration files
│   ├── app.config.ts    # App configuration
│   └── database.config.ts # Database configuration
├── controllers/         # Request handlers
│   ├── BaseController.ts # Base controller class
│   └── UserController.ts # User controller example
├── models/             # Data models
│   ├── BaseModel.ts    # Base model class
│   └── User.ts         # User model example
├── services/           # Business logic
│   ├── BaseService.ts  # Base service class
│   └── UserService.ts  # User service example
├── repositories/       # Data access layer
│   ├── BaseRepository.ts # Base repository class
│   └── UserRepository.ts # User repository example
├── middlewares/        # Custom middlewares
│   ├── errorHandler.ts # Global error handler
│   ├── validate.ts     # Validation middleware
│   ├── auth.ts         # Authentication middleware
│   └── logger.ts       # Request logger
├── routes/            # API routes
│   ├── index.ts       # Main router
│   └── user.routes.ts # User routes example
├── validators/        # Request validators
│   └── userValidator.ts # User validation rules
├── utils/            # Utilities & helpers
│   ├── ApiResponse.ts # API response formatter
│   ├── Logger.ts      # Logger utility
│   └── constants.ts   # Constants
├── types/            # TypeScript types & interfaces
│   └── index.ts      # Common types
├── database/         # Database connections & migrations
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <your-repo-url>
cd superAI
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo file .env

```bash
cp .env.example .env
```

### 4. Chỉnh sửa file .env với thông tin của bạn

## 🛠️ Scripts

```bash
# Development - Chạy server với hot reload
npm run dev

# Build - Compile TypeScript to JavaScript
npm run build

# Production - Chạy server đã build
npm start

# Production mode
npm run start:prod

# Watch mode - Compile on change
npm run watch

# Clean dist folder
npm run clean
```

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints

#### Health Check

```http
GET /api/v1/health
```

#### Users

```http
GET    /api/v1/users           # Get all users
GET    /api/v1/users/:id       # Get user by ID
POST   /api/v1/users           # Create user (requires auth)
PUT    /api/v1/users/:id       # Update user (requires auth)
DELETE /api/v1/users/:id       # Delete user (requires admin)
```

## 🏗️ Kiến trúc

### Base Classes

Tất cả các module đều extend từ base classes để tái sử dụng code:

-   **BaseController**: Xử lý request/response, pagination, error handling
-   **BaseService**: Business logic layer
-   **BaseRepository**: Data access layer
-   **BaseModel**: Data model với soft delete support

### Flow

```
Request → Routes → Middlewares → Controller → Service → Repository → Database
                                    ↓
                                Response
```

### Ví dụ tạo module mới

#### 1. Tạo Model

```typescript
// src/models/Post.ts
import { BaseModel } from "./BaseModel";

export interface IPost {
    id?: string;
    title: string;
    content: string;
    // ... other fields
}

export class Post extends BaseModel implements IPost {
    title: string;
    content: string;

    constructor(data: Partial<IPost>) {
        super(data);
        this.title = data.title || "";
        this.content = data.content || "";
    }
}
```

#### 2. Tạo Repository

```typescript
// src/repositories/PostRepository.ts
import { BaseRepository } from "./BaseRepository";
import { IPost } from "../models/Post";

export class PostRepository extends BaseRepository<IPost> {
    constructor() {
        super("PostRepository");
    }

    // Implement required methods
    async findAll(query?: IQuery): Promise<IPost[]> {}
    async findById(id: string): Promise<IPost | null> {}
    // ... other methods
}
```

#### 3. Tạo Service

```typescript
// src/services/PostService.ts
import { BaseService } from "./BaseService";
import { IPost } from "../models/Post";
import { PostRepository } from "../repositories/PostRepository";

export class PostService extends BaseService<IPost> {
    private postRepository: PostRepository;

    constructor() {
        super("PostService");
        this.postRepository = new PostRepository();
    }

    // Implement business logic
}
```

#### 4. Tạo Controller

```typescript
// src/controllers/PostController.ts
import { BaseController } from "./BaseController";
import { PostService } from "../services/PostService";

export class PostController extends BaseController {
    private postService: PostService;

    constructor() {
        super("PostController");
        this.postService = new PostService();
    }

    index = this.asyncHandler(async (req, res, next) => {
        const posts = await this.postService.findAll();
        return this.sendSuccess(res, posts);
    });
}
```

#### 5. Tạo Routes

```typescript
// src/routes/post.routes.ts
import { Router } from "express";
import { PostController } from "../controllers/PostController";

const router = Router();
const postController = new PostController();

router.get("/", postController.index);
// ... other routes

export default router;
```

#### 6. Đăng ký routes

```typescript
// src/routes/index.ts
import postRoutes from "./post.routes";

router.use("/posts", postRoutes);
```

## 🔐 Authentication

Sử dụng JWT để xác thực:

```typescript
import { authenticate, authorize } from "../middlewares/auth";

// Require authentication
router.post("/posts", authenticate, postController.store);

// Require specific role
router.delete(
    "/posts/:id",
    authenticate,
    authorize("admin"),
    postController.destroy
);
```

## ✅ Validation

Sử dụng express-validator:

```typescript
import { validate } from "../middlewares/validate";
import { createPostValidator } from "../validators/postValidator";

router.post("/posts", validate(createPostValidator), postController.store);
```

## 📦 Dependencies chính

-   **express** - Web framework
-   **typescript** - Type safety
-   **cors** - CORS middleware
-   **helmet** - Security headers
-   **compression** - Response compression
-   **express-validator** - Validation
-   **jsonwebtoken** - JWT authentication
-   **bcrypt** - Password hashing
-   **dotenv** - Environment variables

## 📝 License

ISC
