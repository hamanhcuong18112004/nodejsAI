# 🌱 HƯỚNG DẪN INSERT FAKE DATA VÀO MYSQL DOCKER

## 📋 TÓM TẮT CÁC CÁCH

### **CÁCH 1: Seed Script TypeScript (Khuyến nghị ⭐)**

```bash
# Cài đặt faker
npm install -D @faker-js/faker

# Chạy seed
npm run seed
```

**Ưu điểm:**

-   Linh hoạt, có thể tùy chỉnh logic
-   Tích hợp với code TypeScript
-   Dễ maintain và version control

---

### **CÁCH 2: SQL Script trực tiếp**

```bash
# Chạy từ bên ngoài container
docker exec -i ai_mysql mysql -uroot -proot lab_iot < database/seeds/products.sql

# Hoặc copy vào container rồi chạy
docker cp database/seeds/products.sql ai_mysql:/tmp/
docker exec ai_mysql mysql -uroot -proot lab_iot -e "source /tmp/products.sql"
```

**Ưu điểm:**

-   Đơn giản, trực tiếp
-   Không cần code

---

### **CÁCH 3: Mount SQL vào Docker (Auto-run khi khởi động)**

Sửa file `docker-compose.yml`:

```yaml
services:
    mysql:
        image: mysql:8.0
        container_name: ai_mysql
        restart: always
        environment:
            MYSQL_ROOT_PASSWORD: root
            MYSQL_DATABASE: lab_iot
            MYSQL_USER: myuser
            MYSQL_PASSWORD: mypassword
        ports:
            - "13306:3306"
        volumes:
            - ./mysql_data:/var/lib/mysql
            - ./database/migrations:/docker-entrypoint-initdb.d # 🔥 Thêm dòng này
```

**LƯU Ý:** Chỉ chạy khi container được tạo lần đầu. Để chạy lại:

```bash
docker-compose down -v
docker-compose up -d
```

---

### **CÁCH 4: Exec vào Container và chạy SQL**

```bash
# 1. Vào MySQL shell
docker exec -it ai_mysql mysql -uroot -proot lab_iot

# 2. Chạy các lệnh SQL thủ công
INSERT INTO products (sku, price, stock) VALUES ('TEST001', 99.99, 100);
```

---

### **CÁCH 5: Dùng MySQL Workbench/phpMyAdmin**

```bash
# Cài phpMyAdmin (thêm vào docker-compose.yml)
phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: ai_phpmyadmin
    environment:
        PMA_HOST: mysql
        PMA_PORT: 3306
        MYSQL_ROOT_PASSWORD: root
    ports:
        - "8080:80"
    depends_on:
        - mysql
```

Truy cập: http://localhost:8080

---

## 🚀 CÁCH DÙNG NHANH NHẤT

```bash
# Bước 1: Cài faker (chỉ cần 1 lần)
npm install -D @faker-js/faker

# Bước 2: Chạy seed
npm run seed

# Hoặc seed với số lượng tùy chỉnh (sửa trong src/database/seeders/index.ts)
```

---

## 📝 KIỂM TRA DỮ LIỆU

```bash
# Kiểm tra trong Docker
docker exec -it ai_mysql mysql -uroot -proot lab_iot -e "SELECT COUNT(*) FROM products"

# Hoặc trong code
# GET http://localhost:3000/api/products
```

---

## 🔧 DEBUG

Nếu gặp lỗi:

```bash
# Xem logs
docker logs ai_mysql

# Restart container
docker restart ai_mysql

# Xóa và tạo lại database
docker exec ai_mysql mysql -uroot -proot -e "DROP DATABASE lab_iot; CREATE DATABASE lab_iot;"
```
