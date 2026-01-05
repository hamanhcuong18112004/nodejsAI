import { BaseRepository } from "./BaseRepository";
import { Product, IProduct } from "../models/database/product.model";
import { IProductTranslation } from "../models/database/product-translation.model";
import { getFallbackChain } from "../utils/i18n";
import { getMySQLPool } from "../database/connect";

export class ProductRepository extends BaseRepository<Product> {
    constructor() {
        super("products");
    }

    /**
     * Get product with translations for a specific language (with fallback)
     */
    async findByIdWithTranslation(
        productId: number,
        language: string
    ): Promise<IProduct | null> {
        const pool = getMySQLPool();
        const fallbackChain = getFallbackChain(language);

        const query = `
      SELECT 
        p.*,
        pt.name,
        pt.description,
        pt.language_code as current_language
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id
        AND pt.language_code IN (${fallbackChain
            .map(() => `?`)
            .join(",")})
      WHERE p.id = ?
      ORDER BY 
        CASE pt.language_code
          ${fallbackChain
              .map((lang, i) => `WHEN '${lang}' THEN ${i}`)
              .join("\n          ")}
          ELSE ${fallbackChain.length}
        END
      LIMIT 1
    `;

        const [rows] = await pool.query(query, [...fallbackChain, productId]);
        return (rows as any[])[0] || null;
    }

    /**
     * Get all products with translations for a specific language
     */
    async findAllWithTranslation(language: string): Promise<IProduct[]> {
        const pool = getMySQLPool();
        const fallbackChain = getFallbackChain(language);

        const query = `
      SELECT 
        p.*,
        COALESCE(
          (SELECT name FROM product_translations 
           WHERE product_id = p.id AND language_code = ? LIMIT 1),
          (SELECT name FROM product_translations 
           WHERE product_id = p.id AND language_code = 'en' LIMIT 1),
          (SELECT name FROM product_translations 
           WHERE product_id = p.id LIMIT 1)
        ) as name,
        COALESCE(
          (SELECT description FROM product_translations 
           WHERE product_id = p.id AND language_code = ? LIMIT 1),
          (SELECT description FROM product_translations 
           WHERE product_id = p.id AND language_code = 'en' LIMIT 1),
          (SELECT description FROM product_translations 
           WHERE product_id = p.id LIMIT 1)
        ) as description
      FROM products p
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `;

        const [rows] = await pool.query(query, [language, language]);
        return rows as IProduct[];
    }

    /**
     * Create or update translation for a product
     */
    async upsertTranslation(
        productId: string,
        languageCode: string,
        data: { name: string; description?: string }
    ): Promise<IProductTranslation> {
        const pool = getMySQLPool();
        
        // MySQL syntax for upsert (INSERT ... ON DUPLICATE KEY UPDATE)
        const query = `
      INSERT INTO product_translations (product_id, language_code, name, description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        description = VALUES(description),
        updated_at = CURRENT_TIMESTAMP
    `;

        await pool.query(query, [productId, languageCode, data.name, data.description]);
        
        return {
            productId,
            languageCode,
            name: data.name,
            description: data.description,
        };
    }

    /**
     * Get all translations for a product
     */
    async getProductTranslations(
        productId: number
    ): Promise<IProductTranslation[]> {
        const pool = getMySQLPool();
        
        const query = `
      SELECT * FROM product_translations
      WHERE product_id = ?
      ORDER BY language_code
    `;

        const [rows] = await pool.query(query, [productId]);
        return rows as IProductTranslation[];
    }
}
