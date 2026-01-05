# Kiến Trúc Backend - MVC Pattern

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [Chi Tiết Từng Layer](#chi-tiết-từng-layer)
4. [Flow Xử Lý Request](#flow-xử-lý-request)
5. [Ví Dụ Thực Tế](#ví-dụ-thực-tế)

---

## 🎯 Tổng Quan

Dự án sử dụng **MVC Pattern** kết hợp với **Repository Pattern** và **Service Layer** để tạo ra một kiến trúc **Clean Architecture** có khả năng mở rộng cao.

### Nguyên Tắc Thiết Kế

-   **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
-   **DRY (Don't Repeat Yourself)**: Sử dụng Base Classes để tái sử dụng code
-   **SOLID Principles**: Đặc biệt là Single Responsibility và Dependency Inversion
-   **Scalability**: Dễ dàng thêm module mới

---

## 📁 Cấu Trúc Thư Mục

```
src/
├── app.ts                      # Khởi tạo Express App
├── server.ts                   # Entry point, start server
│
├── config/                     # Cấu hình ứng dụng
│   ├── app.config.ts          # Config chung (port, env, cors...)
│   └── database.config.ts     # Config database connections
│
├── controllers/                # Xử lý HTTP requests
│   ├── BaseController.ts      # Base class cho tất cả controllers
│   └── UserController.ts      # Controller cụ thể cho User
│
├── services/                   # Business logic
│   ├── BaseService.ts         # Base class cho services
│   └── UserService.ts         # Service xử lý logic User
│
├── repositories/               # Tương tác với database
│   ├── BaseRepository.ts      # Base class CRUD operations
│   └── UserRepository.ts      # Repository cho User model
│
├── models/                     # Data models/entities
│   └── User.ts                # User model/schema
│
├── middlewares/                # Express middlewares
│   ├── index.ts               # Export tất cả middlewares
│   ├── auth.ts                # Xác thực JWT
│   ├── validate.ts            # Validate request data
│   ├── errorHandler.ts        # Global error handling
│   ├── logger.ts              # Log requests
│   └── notFound.ts            # Handle 404
│
├── validators/                 # Validation schemas
│   └── userValidator.ts       # Validation rules cho User
│
├── routes/                     # API routes
│   ├── index.ts               # Tổng hợp tất cả routes
│   └── user.routes.ts         # Routes cho User module
│
├── utils/                      # Utilities/helpers
│   ├── ApiResponse.ts         # Chuẩn hóa API response
│   ├── Logger.ts              # Custom logger
│   └── constants.ts           # Hằng số dùng chung
│
└── types/                      # TypeScript type definitions
    └── index.ts               # Custom types/interfaces
```

---

## 🔍 Chi Tiết Từng Layer

### 1️⃣ **Models** (`/models`)

**Vai trò**: Định nghĩa cấu trúc dữ liệu và schema

**Tại sao tách riêng?**

-   Đại diện cho các entity trong domain
-   Dễ dàng migration khi đổi database
-   Tập trung quản lý data structure

**Ví dụ**: `User.ts`

```typescript
// Định nghĩa User entity
interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Nếu dùng Mongoose
const UserSchema = new Schema({...});

// Nếu dùng TypeORM
@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: string;
  // ...
}
```

**Chứa gì?**

-   Interface/Type definition
-   Database schema (Mongoose Schema, TypeORM Entity...)
-   Model methods (nếu cần)

---

### 2️⃣ **Repositories** (`/repositories`)

**Vai trò**: Trực tiếp tương tác với database

**Tại sao tách riêng?**

-   Tách biệt logic truy vấn database khỏi business logic
-   Dễ dàng thay đổi database mà không ảnh hưởng service
-   Tái sử dụng các query phổ biến

**Base Repository** cung cấp:

```typescript
// CRUD cơ bản cho mọi entity
-create(data) -
    findById(id) -
    findAll(filter, options) -
    update(id, data) -
    delete id -
    count(filter);
```

**Ví dụ**: `UserRepository.ts`

```typescript
class UserRepository extends BaseRepository<IUser> {
    // Kế thừa tất cả CRUD từ BaseRepository

    // Thêm query đặc thù cho User
    async findByEmail(email: string) {
        return this.model.findOne({ email });
    }

    async findActiveUsers() {
        return this.model.find({ isActive: true });
    }
}
```

**Chứa gì?**

-   Các query database (find, create, update, delete)
-   Complex queries đặc thù cho từng entity
-   Transaction handling

---

### 3️⃣ **Services** (`/services`)

**Vai trò**: Chứa toàn bộ business logic

**Tại sao tách riêng?**

-   Tập trung xử lý logic nghiệp vụ
-   Controller chỉ nhận request và trả response
-   Dễ test vì không phụ thuộc vào HTTP

**Base Service** cung cấp:

```typescript
// CRUD operations với validation
-create(data) - findById(id) - findAll(query) - update(id, data) - delete id;
```

**Ví dụ**: `UserService.ts`

```typescript
class UserService extends BaseService<IUser> {
    constructor(private userRepository: UserRepository) {
        super(userRepository);
    }

    // Business logic đặc thù
    async register(userData: CreateUserDTO) {
        // 1. Validate
        // 2. Check email tồn tại
        const exists = await this.userRepository.findByEmail(userData.email);
        if (exists) throw new Error("Email đã tồn tại");

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // 4. Create user
        return this.userRepository.create({
            ...userData,
            password: hashedPassword,
        });
    }

    async login(email: string, password: string) {
        // Logic đăng nhập
        // Kiểm tra credential
        // Generate JWT token
        // ...
    }
}
```

**Chứa gì?**

-   Business rules và validation
-   Xử lý dữ liệu trước khi lưu
-   Tương tác với nhiều repositories
-   External API calls

---

### 4️⃣ **Controllers** (`/controllers`)

**Vai trò**: Xử lý HTTP request/response

**Tại sao tách riêng?**

-   Làm cầu nối giữa HTTP layer và business logic
-   Xử lý input/output formatting
-   Chỉ lo về HTTP concerns

**Base Controller** cung cấp:

```typescript
// Response helpers
-sendSuccess(res, data, message) -
    sendError(res, error) -
    sendCreated(res, data) -
    sendNoContent(res);
```

**Ví dụ**: `UserController.ts`

```typescript
class UserController extends BaseController {
    constructor(private userService: UserService) {
        super();
    }

    async register(req: Request, res: Response) {
        try {
            // 1. Lấy data từ request
            const userData = req.body;

            // 2. Gọi service xử lý
            const user = await this.userService.register(userData);

            // 3. Trả response
            this.sendCreated(res, user, "Đăng ký thành công");
        } catch (error) {
            this.sendError(res, error);
        }
    }

    async getProfile(req: Request, res: Response) {
        const userId = req.user.id; // Từ auth middleware
        const user = await this.userService.findById(userId);
        this.sendSuccess(res, user);
    }
}
```

**Chứa gì?**

-   Lấy data từ req (body, params, query)
-   Gọi service methods
-   Format và trả response
-   HTTP status codes

---

### 5️⃣ **Middlewares** (`/middlewares`)

**Vai trò**: Xử lý trước/sau mỗi request

**Tại sao tách riêng?**

-   Tái sử dụng logic chung (auth, logging, validation)
-   Giữ controllers gọn gẽ
-   Dễ dàng bật/tắt features

**Các middlewares quan trọng**:

**`auth.ts`** - Xác thực

```typescript
// Kiểm tra JWT token
// Attach user info vào req.user
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({...});

  const decoded = jwt.verify(token, SECRET);
  req.user = decoded;
  next();
};
```

**`validate.ts`** - Validation

```typescript
// Validate request data với schema
export const validate = (schema: Schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({...});
    next();
  };
};
```

**`errorHandler.ts`** - Xử lý lỗi

```typescript
// Bắt tất cả lỗi và format response
export const errorHandler = (err, req, res, next) => {
    logger.error(err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === "dev" ? err.stack : undefined,
    });
};
```

---

### 6️⃣ **Routes** (`/routes`)

**Vai trò**: Định nghĩa API endpoints

**Tại sao tách riêng?**

-   Dễ dàng quản lý tất cả endpoints
-   Áp dụng middlewares cho từng route
-   Tổ chức theo module

**Ví dụ**: `user.routes.ts`

```typescript
const router = Router();
const userController = new UserController(userService);

// Public routes
router.post(
    "/register",
    validate(userValidator.register),
    userController.register
);

router.post("/login", validate(userValidator.login), userController.login);

// Protected routes
router.get("/profile", authenticate, userController.getProfile);

router.put(
    "/profile",
    authenticate,
    validate(userValidator.updateProfile),
    userController.updateProfile
);

export default router;
```

**`index.ts`** - Tổng hợp

```typescript
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
```

---

### 7️⃣ **Validators** (`/validators`)

**Vai trò**: Định nghĩa validation rules

**Tại sao tách riêng?**

-   Validation logic tái sử dụng
-   Dễ maintain và update rules
-   Tách biệt validation khỏi controllers

**Ví dụ**: `userValidator.ts`

```typescript
import Joi from "joi";

export const userValidator = {
    register: Joi.object({
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("admin", "user").default("user"),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    updateProfile: Joi.object({
        name: Joi.string().min(3).max(50),
        avatar: Joi.string().uri(),
    }),
};
```

---

### 8️⃣ **Utils** (`/utils`)

**Vai trò**: Các hàm tiện ích dùng chung

**Ví dụ**:

**`ApiResponse.ts`**

```typescript
// Chuẩn hóa format response
class ApiResponse {
    static success(data, message = "Success") {
        return { success: true, message, data };
    }

    static error(message, statusCode = 500) {
        return { success: false, message, statusCode };
    }
}
```

**`Logger.ts`**

```typescript
// Custom logger với Winston/Pino
class Logger {
    info(message) {
        /* ... */
    }
    error(message) {
        /* ... */
    }
    warn(message) {
        /* ... */
    }
}
```

---

### 9️⃣ **Config** (`/config`)

**Vai trò**: Quản lý cấu hình tập trung

**`app.config.ts`**

```typescript
export default {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET,
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
    },
};
```

**`database.config.ts`**

```typescript
export default {
    mongodb: {
        uri: process.env.MONGO_URI,
        options: { useNewUrlParser: true },
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
};
```

---

## 🔄 Flow Xử Lý Request

```
Client Request
    ↓
[1] Routes (user.routes.ts)
    → Xác định endpoint
    ↓
[2] Middlewares (logger, auth, validate)
    → Log request
    → Verify JWT token
    → Validate input data
    ↓
[3] Controller (UserController)
    → Nhận request
    → Parse data từ req.body/params/query
    ↓
[4] Service (UserService)
    → Thực thi business logic
    → Validate business rules
    ↓
[5] Repository (UserRepository)
    → Query database
    → CRUD operations
    ↓
[6] Model (User)
    → Data structure
    → Schema validation
    ↓
Database
    ↓
[Response Flow - Ngược lại]
Repository → Service → Controller → Client
```

---

## 💡 Ví Dụ Thực Tế: Feature "Đăng Ký User"

### **1. Model** - `models/User.ts`

```typescript
interface IUser {
    id: string;
    name: string;
    email: string;
    password: string; // hashed
    role: "admin" | "user";
    isActive: boolean;
    createdAt: Date;
}
```

### **2. Repository** - `repositories/UserRepository.ts`

```typescript
class UserRepository extends BaseRepository<IUser> {
    async findByEmail(email: string) {
        return this.model.findOne({ email });
    }

    async createUser(data: CreateUserDTO) {
        return this.model.create(data);
    }
}
```

### **3. Service** - `services/UserService.ts`

```typescript
class UserService extends BaseService<IUser> {
    async register(userData: CreateUserDTO) {
        // Validate business rules
        const existingUser = await this.repository.findByEmail(userData.email);
        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        const user = await this.repository.createUser({
            ...userData,
            password: hashedPassword,
            isActive: true,
            role: "user",
        });

        // Generate token
        const token = jwt.sign({ id: user.id }, JWT_SECRET);

        return { user, token };
    }
}
```

### **4. Controller** - `controllers/UserController.ts`

```typescript
class UserController extends BaseController {
    async register(req: Request, res: Response) {
        try {
            const result = await this.userService.register(req.body);
            this.sendCreated(res, result, "Đăng ký thành công");
        } catch (error) {
            this.sendError(res, error);
        }
    }
}
```

### **5. Validator** - `validators/userValidator.ts`

```typescript
export const userValidator = {
    register: Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),
};
```

### **6. Route** - `routes/user.routes.ts`

```typescript
router.post(
    "/register",
    validate(userValidator.register),
    userController.register
);
```

### **7. Request Flow**

```
POST /api/users/register
Body: { name: "John", email: "john@mail.com", password: "123456" }
    ↓
Middleware: validate → Pass ✓
    ↓
Controller: userController.register()
    ↓
Service: userService.register()
    → Check email exists? No ✓
    → Hash password ✓
    → Create user ✓
    → Generate token ✓
    ↓
Repository: userRepository.createUser()
    → Insert to DB ✓
    ↓
Response: {
  success: true,
  message: "Đăng ký thành công",
  data: { user: {...}, token: "..." }
}
```

---

## ✅ Ưu Điểm Của Kiến Trúc Này

1. **Separation of Concerns**: Mỗi layer có trách nhiệm rõ ràng
2. **Testable**: Dễ dàng unit test từng layer riêng biệt
3. **Maintainable**: Code sạch, dễ đọc, dễ sửa
4. **Scalable**: Thêm feature mới không ảnh hưởng code cũ
5. **Reusable**: Base classes giúp tái sử dụng code
6. **Flexible**: Dễ dàng thay đổi database, framework

---

## 🚀 Khi Thêm Module Mới

Ví dụ: Thêm module **Product**

1. **Model**: `models/Product.ts` - Schema sản phẩm
2. **Repository**: `repositories/ProductRepository.ts extends BaseRepository`
3. **Service**: `services/ProductService.ts extends BaseService`
4. **Controller**: `controllers/ProductController.ts extends BaseController`
5. **Validator**: `validators/productValidator.ts`
6. **Routes**: `routes/product.routes.ts`

Chỉ cần tạo 6 files, kế thừa Base classes → Tiết kiệm 70% code!

---

## 📝 Tóm Tắt

| Layer          | Trách Nhiệm               | Ví Dụ                     |
| -------------- | ------------------------- | ------------------------- |
| **Model**      | Định nghĩa data structure | Interface, Schema         |
| **Repository** | Database operations       | CRUD, Complex queries     |
| **Service**    | Business logic            | Validation, Processing    |
| **Controller** | HTTP handling             | Request/Response          |
| **Middleware** | Cross-cutting concerns    | Auth, Logging, Validation |
| **Route**      | API endpoints             | URL mapping               |
| **Validator**  | Input validation          | Joi schemas               |
| **Utils**      | Helper functions          | ApiResponse, Logger       |
| **Config**     | Configuration             | DB, App settings          |

---

**Kết luận**: Kiến trúc này giúp code **clean**, **maintainable**, **scalable** và tuân thủ các **best practices** của ngành.
