import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategoryId,
    getLowStockProducts,
    getProductsBySupplierId,
    deleteProductById,
    updateProduct
} from '../controller/productController.js'
import { requireRole } from '../middleware/requireRole.js';
const router = express.Router();

router.get('/low-stock', getLowStockProducts);
router.get('/supplier/:supplierId', getProductsBySupplierId);

router.route('/:id')
    .get(getProductById) // Route to get a product by ID
    .put(requireRole(['manager', 'admin']), updateProduct) // Route to update a product by ID
    .delete(requireRole(['manager', 'admin']), deleteProductById); // Route to delete a product by ID
router.get('/', getAllProducts); // Route to get all products
router.post('/', requireRole(['manager', 'admin']), createProduct); // Route to create a new product
router.get('/category/{categoryId}', getProductsByCategoryId);


export default router;