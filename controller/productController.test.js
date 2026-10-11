import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const productModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../model/product.js', () => ({
    Product: productModel,
}));

const {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategoryId,
    getLowStockProducts,
    getProductsBySupplierId,
    updateProduct,
    deleteProductById,
} = await import('./productController.js');

const createResponse = () => {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
};

const validProduct = {
    name: 'Desk',
    description: 'Office desk',
    sku: 'DESK-001',
    price: 125,
    quantity: 10,
    minimumStock: 2,
    categoryId: '0123456789abcdef01234567',
    supplierId: 'abcdef0123456789abcdef01',
};

describe('product controller', () => {
    let response;

    beforeEach(() => {
        response = createResponse();
    });

    describe('createProduct', () => {
        test('creates a product from valid input', async () => {
            const product = { _id: 'product-id', ...validProduct };
            productModel.create.mockResolvedValue(product);

            await createProduct({ body: validProduct }, response);

            expect(productModel.create).toHaveBeenCalledWith(validProduct);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product created successfully',
                data: product,
            });
        });

        test('rejects invalid input without creating a product', async () => {
            await createProduct({ body: { ...validProduct, price: -1 } }, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: expect.arrayContaining([expect.any(String)]),
            });
            expect(productModel.create).not.toHaveBeenCalled();
        });

        test('returns an internal server error when creation fails', async () => {
            productModel.create.mockRejectedValue(new Error('database unavailable'));

            await createProduct({ body: validProduct }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getAllProducts', () => {
        test('filters products by supplied query parameters', async () => {
            const products = [{ _id: 'product-id', ...validProduct }];
            productModel.find.mockResolvedValue(products);

            await getAllProducts(
                {
                    query: {
                        name: 'Desk',
                        sku: 'DESK-001',
                        price: '125',
                        quantity: '10',
                        minimumStock: '2',
                        categoryId: validProduct.categoryId,
                        supplierId: validProduct.supplierId,
                        productId: 'product-id',
                    },
                },
                response,
            );

            expect(productModel.find).toHaveBeenCalledWith({
                name: 'Desk',
                sku: 'DESK-001',
                price: '125',
                quantity: '10',
                minimumStock: '2',
                categoryId: validProduct.categoryId,
                supplierId: validProduct.supplierId,
                productId: 'product-id',
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: products,
            });
        });
    });

    describe('getProductById', () => {
        test('returns the matching product', async () => {
            const product = { _id: 'product-id', ...validProduct };
            productModel.findById.mockResolvedValue(product);

            await getProductById({ params: { productId: 'product-id' } }, response);

            expect(productModel.findById).toHaveBeenCalledWith('product-id');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: product,
            });
        });

        test('returns not found when the product does not exist', async () => {
            productModel.findById.mockResolvedValue(null);

            await getProductById({ params: { productId: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Product not found',
            });
        });
    });

    describe('getProductsByCategoryId', () => {
        test('returns products for the requested category', async () => {
            const products = [{ _id: 'product-id', ...validProduct }];
            productModel.find.mockResolvedValue(products);

            await getProductsByCategoryId(
                { params: { categoryId: validProduct.categoryId } },
                response,
            );

            expect(productModel.find).toHaveBeenCalledWith(validProduct.categoryId);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: products,
            });
        });

        test('returns bad request when the category ID is missing', async () => {
            await getProductsByCategoryId({ params: {} }, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Category Id is missing',
            });
            expect(productModel.find).not.toHaveBeenCalled();
        });
    });

    describe('getLowStockProducts', () => {
        test('returns products at or below their minimum stock', async () => {
            const products = [{ _id: 'product-id', quantity: 2, minimumStock: 2 }];
            productModel.find.mockResolvedValue(products);

            await getLowStockProducts({}, response);

            expect(productModel.find).toHaveBeenCalledWith({
                $expr: { $lte: ['$quantity', '$minimumStock'] },
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: products,
            });
        });
    });

    describe('getProductsBySupplierId', () => {
        test('returns products for the requested supplier', async () => {
            const products = [{ _id: 'product-id', ...validProduct }];
            productModel.find.mockResolvedValue(products);

            await getProductsBySupplierId(
                { params: { supplierId: validProduct.supplierId } },
                response,
            );

            expect(productModel.find).toHaveBeenCalledWith({
                supplierId: validProduct.supplierId,
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: products,
            });
        });
    });

    describe('updateProduct', () => {
        test('updates and returns the matching product', async () => {
            const product = { _id: 'product-id', ...validProduct };
            productModel.findByIdAndUpdate.mockResolvedValue(product);

            await updateProduct(
                { params: { id: 'product-id' }, body: validProduct },
                response,
            );

            expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'product-id',
                validProduct,
                { new: true },
            );
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product updated successfully',
                data: product,
            });
        });

        test('rejects invalid input without updating the product', async () => {
            await updateProduct(
                {
                    params: { id: 'product-id' },
                    body: { ...validProduct, categoryId: 'invalid-id' },
                },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('returns not found when the product does not exist', async () => {
            productModel.findByIdAndUpdate.mockResolvedValue(null);

            await updateProduct(
                { params: { id: 'missing-id' }, body: validProduct },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Product not found',
            });
        });
    });

    describe('deleteProductById', () => {
        test('deletes the matching product', async () => {
            productModel.findByIdAndDelete.mockResolvedValue({ _id: 'product-id' });

            await deleteProductById({ params: { id: 'product-id' } }, response);

            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('product-id');
            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Product deleted successfully',
            });
        });

        test('returns not found when the product does not exist', async () => {
            productModel.findByIdAndDelete.mockResolvedValue(null);

            await deleteProductById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Product not found',
            });
        });
    });
});
