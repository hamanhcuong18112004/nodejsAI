import { BaseService } from "./base.service";
import { ProductRepository } from "../repositories/ProductRepository";
import { Product, IProduct } from "../models/database/product.model";
import { IProductTranslation } from "../models/database/product-translation.model";

export class ProductService extends BaseService<Product> {
    private productRepository: ProductRepository;

    constructor() {
        const repository = new ProductRepository();
        super("ProductService");
        this.productRepository = repository;
    }

    /**
     * Get product by ID with appropriate language translation
     */
    async getProductById(
        productId: number,
        language: string
    ): Promise<IProduct | null> {
        return this.productRepository.findByIdWithTranslation(
            productId,
            language
        );
    }

    /**
     * Get all products with translations
     */
    async getAllProducts(language: string): Promise<IProduct[]> {
        return this.productRepository.findAllWithTranslation(language);
    }

    async getProductInfo(query: string): Promise<string> {
        // Simple keyword-based product info retrieval
        const productId = parseInt(query.match(/\d+/)?.[0] || "0", 10);
        if (isNaN(productId) || productId <= 0) {
            return "Tôi không tìm thấy thông tin này.";
        }
        const product = await this.getProductById(productId, "vi");
        if (!product) {
            return "Tôi không tìm thấy thông tin này.";
        }
        return `Sản phẩm: ${product.name}, Mô tả: ${product.description}, Giá: ${product.price} VND.`;
    }

    /**
     * Create product with initial translations
     */
    async createProduct(
        productData: Omit<IProduct, "id" | "createdAt" | "updatedAt">,
        translations: Array<{
            languageCode: string;
            name: string;
            description?: string;
        }>
    ): Promise<IProduct> {
        // Create base product
        const product = await this.create(productData as any);

        if (!product.id) {
            throw new Error("Failed to create product");
        }

        // Add translations
        // for (const translation of translations) {
        //     await this.productRepository.upsertTransalation(
        //         product.id,
        //         translation.languageCode,
        //         {
        //             name: translation.name,
        //             description: translation.description,
        //         }
        //     );
        // }

        return product;
    }

    /**
     * Update product translation
     */
    async updateTranslation(
        productId: string,
        languageCode: string,
        data: { name: string; description?: string }
    ): Promise<IProductTranslation> {
        return this.productRepository.upsertTranslation(
            productId,
            languageCode,
            data
        );
    }

    /**
     * Get all translations for a product
     */
    async getProductTranslations(
        productId: number
    ): Promise<IProductTranslation[]> {
        return this.productRepository.getProductTranslations(productId);
    }
}
