import express from 'express';
import { createCategory, getAllCategories, updateCategoryById, getCategoryById, deleteCategoryById } from '../controller/categoryController.js';
import { requireRole } from '../middleware/requireRole.js';
const router = express.Router();


router.route('/:id')
    .get(getCategoryById) // Route to get a category by ID
    .put(requireRole(['admin']), updateCategoryById) // Route to update a category by ID
    .delete(requireRole(['admin']), deleteCategoryById); // Route to delete a category by ID
router.get('/', getAllCategories); // Route to get all categories
router.post('/', requireRole(['admin']), createCategory); // Route to create a new category


export default router;