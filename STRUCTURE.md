# SuperAI Backend Structure

## 📂 Cấu trúc thư mục hoàn chỉnh

```
superAI/
├── src/
│   ├── config/                 # Cấu hình ứng dụng
│   │   ├── app.config.ts       # Cấu hình chung (port, env, jwt...)
│   │   └── database.config.ts  # Cấu hình database
│   │
│   ├── controllers/            # Controllers - Xử lý request/response
│   │   ├── BaseController.ts   # Base class cho tất cả controllers
│   │   └── UserController.ts   # VD: User controller
│   │
│   ├── models/                 # Models - Định nghĩa cấu trúc dữ liệu
│   │   ├── BaseModel.ts        # Base class với soft delete, timestamps
│   │   └── User.ts             # VD: User model
│   │
│   ├── services/               # Services - Business logic
│   │   ├── BaseService.ts      # Base class cho logic tái sử dụng
│   │   └── UserService.ts      # VD: User service
│   │
│   ├── repositories/           # Repositories - Data access layer
│   │   ├── BaseRepository.ts   # Base class cho database operations
│   │   └── UserRepository.ts   # VD: User repository
│   │
│   ├── middlewares/            # Middlewares - Xử lý giữa request/response
│   │   ├── index.ts            # Export tất cả middlewares
│   │   ├── errorHandler.ts     # Global error handler
│   │   ├── notFound.ts         # 404 handler
│   │   ├── validate.ts         # Validation middleware
│   │   ├── auth.ts             # JWT authentication & authorization
│   │   └── logger.ts           # Request logging
│   │
│   ├── routes/                 # Routes - Định nghĩa API endpoints
│   │   ├── index.ts            # Main router
│   │   └── user.routes.ts      # VD: User routes
│   │
│   ├── validators/             # Validators - Request validation rules
│   │   └── userValidator.ts    # VD: User validation
│   │
│   ├── utils/                  # Utilities - Helper functions
│   │   ├── ApiResponse.ts      # Chuẩn hóa API responses
│   │   ├── Logger.ts           # Logger utility
│   │   └── constants.ts        # Constants (HTTP codes, messages...)
│   │
│   ├── types/                  # TypeScript types & interfaces
│   │   └── index.ts            # Common types, interfaces, error classes
│   │
│   ├── database/               # Database related
│   │   └── (migrations, seeders...)
│   │
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
│
├── dist/                       # Compiled JavaScript (generated)
├── node_modules/               # Dependencies
├── .env                        # Environment variables (git ignored)
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Documentation
```

## 🎯 Mục đích từng thư mục

### 📁 config/

-   Chứa tất cả configuration files
-   Environment variables, database config, app settings
-   **Khi nào dùng**: Thêm config mới khi có service/module mới cần cấu hình

### 📁 controllers/

-   Xử lý HTTP requests/responses
-   Gọi services để xử lý business logic
-   Validate input, format output
-   **Khi nào dùng**: Mỗi resource (User, Post, Product...) cần 1 controller

### 📁 models/

-   Định nghĩa cấu trúc dữ liệu
-   TypeScript interfaces & classes
-   Business methods liên quan đến model
-   **Khi nào dùng**: Mỗi entity trong database cần 1 model

### 📁 services/

-   Business logic layer
-   Xử lý các quy tắc nghiệp vụ
-   Kết hợp nhiều repositories nếu cần
-   **Khi nào dùng**: Tách logic phức tạp ra khỏi controller

### 📁 repositories/

-   Data access layer
-   CRUD operations với database
-   Query building, data mapping
-   **Khi nào dùng**: Mỗi model cần 1 repository cho database operations

### 📁 middlewares/

-   Xử lý trước/sau khi request đến controller
-   Authentication, validation, logging
-   **Khi nào dùng**: Cần xử lý chung cho nhiều routes

### 📁 routes/

-   Định nghĩa API endpoints
-   Ánh xạ HTTP methods với controller methods
-   Apply middlewares
-   **Khi nào dùng**: Mỗi resource cần 1 route file

### 📁 validators/

-   Validation rules cho requests
-   Sử dụng express-validator
-   **Khi nào dùng**: Mỗi API endpoint cần validate input

### 📁 utils/

-   Helper functions, utilities
-   Code tái sử dụng không thuộc business logic
-   **Khi nào dùng**: Function dùng chung ở nhiều nơi

### 📁 types/

-   TypeScript type definitions
-   Interfaces, enums, custom types
-   **Khi nào dùng**: Cần định nghĩa types dùng chung

## 🔄 Flow xử lý request

```
1. Client gửi request
   ↓
2. Routes (routes/) - Map URL → Controller
   ↓
3. Middlewares (middlewares/) - Auth, Validation, Logging
   ↓
4. Controller (controllers/) - Parse request, validate
   ↓
5. Service (services/) - Business logic
   ↓
6. Repository (repositories/) - Database operations
   ↓
7. Model (models/) - Data structure
   ↓
8. Database
   ↓
← Response flow ngược lại
```

## 📝 Quy tắc đặt tên

-   **Files**: PascalCase cho classes (`UserController.ts`), camelCase cho utils (`apiResponse.ts`)
-   **Classes**: PascalCase (`UserController`, `UserService`)
-   **Interfaces**: Prefix với `I` (`IUser`, `IApiResponse`)
-   **Methods**: camelCase (`findById`, `createUser`)
-   **Constants**: UPPER_SNAKE_CASE (`HTTP_STATUS`, `ERROR_MESSAGES`)

## 🎨 Best Practices

1. **Single Responsibility**: Mỗi class/function chỉ làm 1 việc
2. **DRY**: Tái sử dụng code thông qua Base classes
3. **Separation of Concerns**: Tách biệt routes, controllers, services, repositories
4. **Type Safety**: Sử dụng TypeScript types đầy đủ
5. **Error Handling**: Centralized error handling
6. **Validation**: Validate ở cả middleware và service layer
7. **Logging**: Log đầy đủ để debug dễ dàng
