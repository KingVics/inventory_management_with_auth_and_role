import express from 'express';
import { updateSupplierById, createSupplier, getAllSuppliers, getSupplierById, deleteSupplierById } from '../controller/supplierController.js'
import { requireRole } from '../middleware/requireRole.js';
const router = express.Router();


router.route('/:id')
    .get(getSupplierById) // Route to get a supplier by ID
    .put(requireRole(['admin']), updateSupplierById) // Route to update a supplier by ID
    .delete(requireRole(['admin']), deleteSupplierById); // Route to delete a supplier by ID
router.get('/', getAllSuppliers); // Route to get all suppliers
router.post('/', requireRole(['admin']), createSupplier); // Route to create a new supplier


export default router;