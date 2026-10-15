import express from 'express';
import {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    getTransactionsByProductId,
    deleteTransaction,
} from '../controller/transactionController.js';
// import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.get('/product/:productId', getTransactionsByProductId);
router.route('/:transactionId')
    .get(getTransactionById)
    .delete(deleteTransaction);
router.route('/')
    .get(getAllTransactions)
    .post(createTransaction);

export default router;
