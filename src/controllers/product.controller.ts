import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { ProductService } from "../services/product.service";
import { ApiResponse } from "../utils/ApiResponse";
import { getLanguageFromRequest } from "../utils/i18n";

export class ProductController extends BaseController {
    private productService: ProductService;

    constructor() {
        super();
        this.productService = new ProductService();
    }

    /**
     * GET /api/products
     * Get all products with translations
     * Query params: ?lang=zh or use Accept-Language header
     */
    getAllProducts = async (req: Request, res: Response): Promise<void> => {
        try {
            const language = getLanguageFromRequest(
                req.headers["accept-language"],
                req.query.lang as string
            );

            const products = await this.productService.getAllProducts(language);

            ApiResponse.success(
                res,
                products,
                "Products retrieved successfully"
            );
        } catch (error) {
            ApiResponse.error(res, error instanceof Error ? error.message : "Internal server error");
        }
    };

    /**
     * GET /api/products/:id
     * Get product by ID with translation
     */
    getProductById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const language = getLanguageFromRequest(
                req.headers["accept-language"],
                req.query.lang as string
            );

            const product = await this.productService.getProductById(
                parseInt(id),
                language
            );

            if (!product) {
                ApiResponse.notFound(res, "Product not found");
                return;
            }

            ApiResponse.success(res, product, "Product retrieved successfully");
        } catch (error) {
            ApiResponse.error(res, error instanceof Error ? error.message : "Internal server error");
        }
    };

    /**
     * POST /api/products
     * Create product with translations
     * Body: {
     *   sku: "PROD001",
     *   price: 100,
     *   stock: 50,
     *   translations: [
     *     { languageCode: "en", name: "Product", description: "..." },
     *     { languageCode: "vi", name: "Sản phẩm", description: "..." }
     *   ]
     * }
     */
    createProduct = async (req: Request, res: Response): Promise<void> => {
        try {
            const { translations, ...productData } = req.body;

            if (
                !translations ||
                !Array.isArray(translations) ||
                translations.length === 0
            ) {
                ApiResponse.badRequest(
                    res,
                    "At least one translation is required"
                );
                return;
            }

            const product = await this.productService.createProduct(
                productData,
                translations
            );

            ApiResponse.created(res, product, "Product created successfully");
        } catch (error) {
            ApiResponse.error(res, error instanceof Error ? error.message : "Internal server error");
        }
    };

    /**
     * PUT /api/products/:id/translations/:lang
     * Update translation for a specific language
     * Body: { name: "新产品", description: "..." }
     */
    updateTranslation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id, lang } = req.params;
            const { name, description } = req.body;

            if (!name) {
                ApiResponse.badRequest(res, "Name is required");
                return;
            }

            const translation = await this.productService.updateTranslation(
                (id),
                lang,
                { name, description }
            );

            ApiResponse.success(
                res,
                translation,
                "Translation updated successfully"
            );
        } catch (error) {
            ApiResponse.error(res, error instanceof Error ? error.message : "Internal server error");
        }
    };

    /**
     * GET /api/products/:id/translations
     * Get all translations for a product
     */
    getProductTranslations = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const translations =
                await this.productService.getProductTranslations(parseInt(id));

            ApiResponse.success(
                res,
                translations,
                "Translations retrieved successfully"
            );
        } catch (error) {
            ApiResponse.error(res, error instanceof Error ? error.message : "Internal server error");
        }
    };
}
