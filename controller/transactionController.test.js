import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const productModel = {
    findOneAndUpdate: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
};
const transactionModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../model/product.js', () => ({ Product: productModel }));
jest.unstable_mockModule('../model/transaction.js', () => ({ Transaction: transactionModel }));

const {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    getTransactionsByProductId,
    deleteTransaction,
} = await import('./transactionController.js');

const createResponse = () => {
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    return response;
};

const transactionInput = {
    productId: '0123456789abcdef01234567',
    type: 'out',
    quantity: 3,
    notes: 'Order shipment',
};

describe('transaction controller', () => {
    let response;

    beforeEach(() => {
        jest.clearAllMocks();
        response = createResponse();
    });

    describe('createTransaction', () => {
        test('records a stock-out movement and the authenticated user', async () => {
            const product = { quantity: 7 };
            const transaction = { _id: 'transaction-id', ...transactionInput };
            productModel.findOneAndUpdate.mockResolvedValue(product);
            transactionModel.create.mockResolvedValue(transaction);

            await createTransaction(
                { body: transactionInput, user: { userId: 'user-id' } },
                response,
            );

            expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: transactionInput.productId, quantity: { $gte: 3 } },
                { $inc: { quantity: -3 } },
                { new: true },
            );
            expect(transactionModel.create).toHaveBeenCalledWith({
                ...transactionInput,
                userId: 'user-id',
                previousQuantity: 10,
                newQuantity: 7,
            });
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction created successfully',
                data: transaction,
            });
        });

        test('rejects an invalid movement without changing stock', async () => {
            await createTransaction(
                { body: { ...transactionInput, quantity: 0 }, user: { userId: 'user-id' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
            expect(transactionModel.create).not.toHaveBeenCalled();
        });

        test('rejects a stock-out that would make stock negative', async () => {
            productModel.findOneAndUpdate.mockResolvedValue(null);
            productModel.findById.mockResolvedValue({ _id: transactionInput.productId });

            await createTransaction(
                { body: transactionInput, user: { userId: 'user-id' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(409);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Insufficient stock for this transaction',
            });
            expect(transactionModel.create).not.toHaveBeenCalled();
        });

        test('returns not found when the referenced product does not exist', async () => {
            productModel.findOneAndUpdate.mockResolvedValue(null);
            productModel.findById.mockResolvedValue(null);

            await createTransaction(
                { body: transactionInput, user: { userId: 'user-id' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        test('restores stock if the transaction record cannot be created', async () => {
            productModel.findOneAndUpdate.mockResolvedValue({ quantity: 7 });
            transactionModel.create.mockRejectedValue(new Error('database unavailable'));
            productModel.updateOne.mockResolvedValue({ matchedCount: 1 });

            await createTransaction(
                { body: transactionInput, user: { userId: 'user-id' } },
                response,
            );

            expect(productModel.updateOne).toHaveBeenCalledWith(
                { _id: transactionInput.productId },
                { $inc: { quantity: 3 } },
            );
            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({ message: 'database unavailable' });
        });
    });

    describe('read transactions', () => {
        test('returns all transactions', async () => {
            const transactions = [{ _id: 'transaction-id' }];
            transactionModel.find.mockResolvedValue(transactions);

            await getAllTransactions({}, response);

            expect(transactionModel.find).toHaveBeenCalledWith({});
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: transactions });
        });

        test('returns one transaction or not found', async () => {
            const transaction = { _id: 'transaction-id' };
            transactionModel.findById.mockResolvedValue(transaction);

            await getTransactionById({ params: { transactionId: 'transaction-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: transaction });

            response = createResponse();
            transactionModel.findById.mockResolvedValue(null);
            await getTransactionById({ params: { transactionId: 'missing-id' } }, response);
            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'Transaction not found' });
        });

        test('returns transactions for a product', async () => {
            const transactions = [{ _id: 'transaction-id' }];
            transactionModel.find.mockResolvedValue(transactions);

            await getTransactionsByProductId(
                { params: { productId: transactionInput.productId } },
                response,
            );

            expect(transactionModel.find).toHaveBeenCalledWith({ productId: transactionInput.productId });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: transactions });
        });
    });

    describe('deleteTransaction', () => {
        test('reverses stock before deleting the latest transaction', async () => {
            const transaction = {
                _id: { toString: () => 'transaction-id' },
                productId: 'product-id',
                previousQuantity: 10,
                newQuantity: 7,
            };
            transactionModel.findById.mockResolvedValue(transaction);
            transactionModel.findOne.mockResolvedValue(transaction);
            productModel.findOneAndUpdate.mockResolvedValue({ _id: 'product-id', quantity: 10 });
            transactionModel.findByIdAndDelete.mockResolvedValue(transaction);

            await deleteTransaction({ params: { transactionId: 'transaction-id' } }, response);

            expect(transactionModel.findOne).toHaveBeenCalledWith(
                { productId: 'product-id' },
                null,
                { sort: { createdAt: -1, _id: -1 } },
            );
            expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'product-id', quantity: 7 },
                { $set: { quantity: 10 } },
                { new: true },
            );
            expect(transactionModel.findByIdAndDelete).toHaveBeenCalledWith('transaction-id');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction deleted and stock movement reversed',
            });
        });

        test('rejects deletion if the transaction is not the latest', async () => {
            const transaction = {
                _id: { toString: () => 'old-transaction' },
                productId: 'product-id',
            };
            transactionModel.findById.mockResolvedValue(transaction);
            transactionModel.findOne.mockResolvedValue({
                _id: { toString: () => 'new-transaction' },
            });

            await deleteTransaction({ params: { transactionId: 'old-transaction' } }, response);

            expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
            expect(transactionModel.findByIdAndDelete).not.toHaveBeenCalled();
            expect(response.status).toHaveBeenCalledWith(409);
        });

        test('rejects deletion if product stock no longer matches the transaction', async () => {
            const transaction = {
                _id: { toString: () => 'transaction-id' },
                productId: 'product-id',
                previousQuantity: 10,
                newQuantity: 7,
            };
            transactionModel.findById.mockResolvedValue(transaction);
            transactionModel.findOne.mockResolvedValue(transaction);
            productModel.findOneAndUpdate.mockResolvedValue(null);

            await deleteTransaction({ params: { transactionId: 'transaction-id' } }, response);

            expect(transactionModel.findByIdAndDelete).not.toHaveBeenCalled();
            expect(response.status).toHaveBeenCalledWith(409);
        });

        test('restores stock if deleting the transaction record fails', async () => {
            const transaction = {
                _id: { toString: () => 'transaction-id' },
                productId: 'product-id',
                previousQuantity: 10,
                newQuantity: 7,
            };
            transactionModel.findById.mockResolvedValue(transaction);
            transactionModel.findOne.mockResolvedValue(transaction);
            productModel.findOneAndUpdate.mockResolvedValue({ _id: 'product-id', quantity: 10 });
            transactionModel.findByIdAndDelete.mockRejectedValue(new Error('database unavailable'));
            productModel.updateOne.mockResolvedValue({ matchedCount: 1 });

            await deleteTransaction({ params: { transactionId: 'transaction-id' } }, response);

            expect(productModel.updateOne).toHaveBeenCalledWith(
                { _id: 'product-id' },
                { $inc: { quantity: -3 } },
            );
            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({ message: 'database unavailable' });
        });
    });
});
