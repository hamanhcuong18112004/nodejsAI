import "dotenv/config";
import { connectAllDatabases, disconnectAll } from "../connect";
import { seedProducts, seedUsers } from "./product.seeder";

/**
 * Main seeder script
 * Chạy: npm run seed
 */
async function runSeeders() {
    console.log("🚀 Bắt đầu seed database...\n");

    try {
        // 1. Kết nối database
        await connectAllDatabases();

        // 2. Seed products
        await seedProducts(100); // Tạo 100 sản phẩm

        // 3. Seed users (nếu cần)
        await seedUsers(30); // Tạo 30 users

        console.log("\n✅ Seed thành công tất cả dữ liệu!");
    } catch (error) {
        console.error("\n❌ Lỗi khi seed:", error);
        process.exit(1);
    } finally {
        // 4. Đóng kết nối
        await disconnectAll();
        process.exit(0);
    }
}

// Chạy seeders
runSeeders();
