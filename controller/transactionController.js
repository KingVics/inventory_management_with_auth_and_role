import { Product as productModel } from '../model/product.js';
import { Transaction as transactionModel } from '../model/transaction.js';
import { HttpCodes } from '../utils/statusCode.js';
import { createTransactionValidation } from '../validator/validations.js';

const { Ok, CREATED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, CONFLICT } = HttpCodes();

const restoreProductStock = async (productId, delta) => {
    const rollback = await productModel.updateOne(
        { _id: productId },
        { $inc: { quantity: delta } },
    );
    if (rollback.matchedCount === 0) {
        throw new Error('Product was not available for stock rollback');
    }
};

const createTransaction = async (req, res) => {
    try {
        const { value, error } = createTransactionValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((detail) => detail.message) });
        }

        const delta = value.type === 'in' ? value.quantity : -value.quantity;
        const stockFilter = { _id: value.productId };
        if (delta < 0) stockFilter.quantity = { $gte: value.quantity };

        const product = await productModel.findOneAndUpdate(
            stockFilter,
            { $inc: { quantity: delta } },
            { new: true },
        );

        if (!product) {
            const existingProduct = await productModel.findById(value.productId);
            if (!existingProduct) {
                return res.status(NOT_FOUND).json({ message: 'Product not found' });
            }
            return res.status(CONFLICT).json({ message: 'Insufficient stock for this transaction' });
        }

        const transaction = {
            ...value,
            userId: req.user.userId,
            previousQuantity: product.quantity - delta,
            newQuantity: product.quantity,
        };

        try {
            const createdTransaction = await transactionModel.create(transaction);
            return res.status(CREATED).json({
                success: true,
                message: 'Transaction created successfully',
                data: createdTransaction,
            });
        } catch (error) {
            try {
                await restoreProductStock(value.productId, -delta);
            } catch (rollbackError) {
                return res.status(INTERNAL_SERVER_ERROR).json({
                    message: 'Transaction could not be saved and stock rollback failed',
                    error: rollbackError.message,
                });
            }
            throw error;
        }
    } catch (error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const getAllTransactions = async (_req, res) => {
    try {
        const transactions = await transactionModel.find({});
        return res.status(Ok).json({ success: true, data: transactions });
    } catch (error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const transaction = await transactionModel.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(NOT_FOUND).json({ message: 'Transaction not found' });
        }
        return res.status(Ok).json({ success: true, data: transaction });
    } catch (error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const getTransactionsByProductId = async (req, res) => {
    try {
        const transactions = await transactionModel.find({ productId: req.params.productId });
        return res.status(Ok).json({ success: true, data: transactions });
    } catch (error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const transaction = await transactionModel.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(NOT_FOUND).json({ message: 'Transaction not found' });
        }

        const latestTransaction = await transactionModel.findOne(
            { productId: transaction.productId },
            null,
            { sort: { createdAt: -1, _id: -1 } },
        );
        if (!latestTransaction || latestTransaction._id.toString() !== transaction._id.toString()) {
            return res.status(CONFLICT).json({
                message: 'Only the latest transaction for a product can be deleted',
            });
        }

        const product = await productModel.findOneAndUpdate(
            { _id: transaction.productId, quantity: transaction.newQuantity },
            { $set: { quantity: transaction.previousQuantity } },
            { new: true },
        );
        if (!product) {
            return res.status(CONFLICT).json({
                message: 'Product stock has changed; transaction cannot be safely reversed',
            });
        }

        let deletedTransaction;
        try {
            deletedTransaction = await transactionModel.findByIdAndDelete(req.params.transactionId);
        } catch (error) {
            const delta = transaction.newQuantity - transaction.previousQuantity;
            try {
                await restoreProductStock(transaction.productId, delta);
            } catch (rollbackError) {
                return res.status(INTERNAL_SERVER_ERROR).json({
                    message: 'Transaction could not be deleted and stock rollback failed',
                    error: rollbackError.message,
                });
            }
            throw error;
        }

        if (!deletedTransaction) {
            const delta = transaction.newQuantity - transaction.previousQuantity;
            await restoreProductStock(transaction.productId, delta);
            return res.status(NOT_FOUND).json({ message: 'Transaction not found' });
        }

        return res.status(Ok).json({
            success: true,
            message: 'Transaction deleted and stock movement reversed',
        });
    } catch (error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

export {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    getTransactionsByProductId,
    deleteTransaction,
};
