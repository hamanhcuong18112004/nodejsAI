import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const productController = new ProductController();

/**
 * Product Routes with i18n support
 *
 * Usage examples:
 * - GET /api/products?lang=zh
 * - GET /api/products (uses Accept-Language header)
 * - GET /api/products/1?lang=vi
 */

// Get all products
router.get("/", productController.getAllProducts);

// Get product by ID
router.get("/:id", productController.getProductById);

// Create product with translations
router.post("/", productController.createProduct);

// Update translation for specific language
router.put("/:id/translations/:lang", productController.updateTranslation);

// Get all translations for a product
router.get("/:id/translations", productController.getProductTranslations);

export default router;
