import { getMySQLPool } from "../connect";
import { faker } from "@faker-js/faker";

/**
 * Seed fake products vào database
 */
export const seedProducts = async (count: number = 50) => {
    const pool = getMySQLPool();

    console.log(`🌱 Bắt đầu seed ${count} sản phẩm...`);

    try {
        // Xóa dữ liệu cũ (optional)
        await pool.query("DELETE FROM product_translations");
        await pool.query("DELETE FROM products");
        await pool.query("ALTER TABLE products AUTO_INCREMENT = 1");

        // Danh sách ngôn ngữ hỗ trợ
        const languages = ["en", "vi", "zh", "ja", "ko"];

        for (let i = 0; i < count; i++) {
            // 1. Insert product
            const price = faker.commerce.price({ min: 10, max: 1000, dec: 2 });
            const stock = faker.number.int({ min: 0, max: 500 });
            const sku = `SKU${faker.string.alphanumeric(8).toUpperCase()}`;

            const [result] = await pool.query(
                "INSERT INTO products (sku, price, stock, is_active) VALUES (?, ?, ?, ?)",
                [sku, price, stock, faker.datatype.boolean()]
            );

            const productId = (result as any).insertId;

            // 2. Insert translations (random 1-5 ngôn ngữ)
            const numLangs = faker.number.int({ min: 1, max: 5 });
            const selectedLangs = faker.helpers.arrayElements(languages, numLangs);

            for (const lang of selectedLangs) {
                const name = getProductName(lang);
                const description = getProductDescription(lang);

                await pool.query(
                    `INSERT INTO product_translations (product_id, language_code, name, description) 
                     VALUES (?, ?, ?, ?)`,
                    [productId, lang, name, description]
                );
            }

            if ((i + 1) % 10 === 0) {
                console.log(`✅ Đã seed ${i + 1}/${count} sản phẩm`);
            }
        }

        console.log(`🎉 Hoàn thành seed ${count} sản phẩm!`);
    } catch (error) {
        console.error("❌ Lỗi khi seed products:", error);
        throw error;
    }
};

/**
 * Helper: Tạo tên sản phẩm theo ngôn ngữ
 */
function getProductName(lang: string): string {
    const categories = {
        en: ["Wireless", "Smart", "Pro", "Ultra", "Premium"],
        vi: ["Không dây", "Thông minh", "Cao cấp", "Siêu", "Đặc biệt"],
        zh: ["无线", "智能", "专业", "超级", "高级"],
        ja: ["ワイヤレス", "スマート", "プロ", "ウルトラ", "プレミアム"],
        ko: ["무선", "스마트", "프로", "울트라", "프리미엄"],
    };

    const products = {
        en: ["Headphones", "Watch", "Phone", "Laptop", "Tablet", "Speaker", "Camera"],
        vi: ["Tai nghe", "Đồng hồ", "Điện thoại", "Laptop", "Máy tính bảng", "Loa", "Máy ảnh"],
        zh: ["耳机", "手表", "电话", "笔记本电脑", "平板电脑", "扬声器", "相机"],
        ja: ["ヘッドフォン", "時計", "電話", "ノートパソコン", "タブレット", "スピーカー", "カメラ"],
        ko: ["헤드폰", "시계", "전화", "노트북", "태블릿", "스피커", "카메라"],
    };

    const category = faker.helpers.arrayElement(categories[lang as keyof typeof categories]);
    const product = faker.helpers.arrayElement(products[lang as keyof typeof products]);

    return `${category} ${product}`;
}

/**
 * Helper: Tạo mô tả sản phẩm theo ngôn ngữ
 */
function getProductDescription(lang: string): string {
    const descriptions = {
        en: [
            "High-quality product with advanced features",
            "Perfect for daily use and professional work",
            "Durable and long-lasting design",
            "Latest technology with premium materials",
        ],
        vi: [
            "Sản phẩm chất lượng cao với tính năng tiên tiến",
            "Hoàn hảo cho sử dụng hàng ngày và công việc chuyên nghiệp",
            "Thiết kế bền bỉ và lâu dài",
            "Công nghệ mới nhất với vật liệu cao cấp",
        ],
        zh: [
            "具有先进功能的高品质产品",
            "非常适合日常使用和专业工作",
            "耐用且持久的设计",
            "采用优质材料的最新技术",
        ],
        ja: [
            "高度な機能を備えた高品質な製品",
            "日常使用とプロの仕事に最適",
            "耐久性があり長持ちするデザイン",
            "プレミアム素材を使用した最新技術",
        ],
        ko: [
            "고급 기능을 갖춘 고품질 제품",
            "일상적인 사용과 전문적인 작업에 완벽함",
            "내구성이 뛰어나고 오래 지속되는 디자인",
            "프리미엄 소재를 사용한 최신 기술",
        ],
    };

    return faker.helpers.arrayElement(descriptions[lang as keyof typeof descriptions]);
}

/**
 * Seed users (nếu có bảng users)
 */
export const seedUsers = async (count: number = 20) => {
    const pool = getMySQLPool();

    console.log(`🌱 Bắt đầu seed ${count} users...`);

    try {
        // Kiểm tra bảng users có tồn tại không
        const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
        if ((tables as any[]).length === 0) {
            console.log("⚠️ Bảng users chưa tồn tại, bỏ qua seed users");
            return;
        }

        await pool.query("DELETE FROM users WHERE email LIKE '%@faker.test'");

        for (let i = 0; i < count; i++) {
            const email = faker.internet.email();
            const name = faker.person.fullName();
            const password = faker.internet.password();

            await pool.query(
                `INSERT INTO users (email, name, password, created_at) 
                 VALUES (?, ?, ?, NOW())`,
                [email, name, password]
            );
        }

        console.log(`🎉 Hoàn thành seed ${count} users!`);
    } catch (error) {
        console.error("❌ Lỗi khi seed users:", error);
        throw error;
    }
};
