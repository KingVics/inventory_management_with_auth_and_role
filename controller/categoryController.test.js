import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const categoryModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../model/category.js', () => ({
    Category: categoryModel,
}));

const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
} = await import('./categoryController.js');

const createResponse = () => {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
};

describe('category controller', () => {
    let response;

    beforeEach(() => {
        response = createResponse();
    });

    describe('createCategory', () => {
        test('creates a category from valid input', async () => {
            const category = { _id: 'category-id', name: 'Office' };
            categoryModel.create.mockResolvedValue(category);

            await createCategory(
                { body: { name: 'Office', description: 'Office supplies' } },
                response,
            );

            expect(categoryModel.create).toHaveBeenCalledWith({
                name: 'Office',
                description: 'Office supplies',
            });
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Category created successfully',
                data: category,
            });
        });

        test('rejects invalid input without creating a category', async () => {
            await createCategory({ body: {} }, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: expect.arrayContaining([expect.any(String)]),
            });
            expect(categoryModel.create).not.toHaveBeenCalled();
        });

        test('returns an internal server error when creation fails', async () => {
            categoryModel.create.mockRejectedValue(new Error('database unavailable'));

            await createCategory({ body: { name: 'Office' } }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getAllCategories', () => {
        test('filters categories by supplied query parameters', async () => {
            const categories = [{ name: 'Office' }];
            categoryModel.find.mockResolvedValue(categories);

            await getAllCategories(
                { query: { name: 'Office', description: 'Supplies' } },
                response,
            );

            expect(categoryModel.find).toHaveBeenCalledWith({
                name: 'Office',
                description: 'Supplies',
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: categories,
            });
        });

        test('returns an internal server error when lookup fails', async () => {
            categoryModel.find.mockRejectedValue(new Error('database unavailable'));

            await getAllCategories({ query: {} }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getCategoryById', () => {
        test('returns the matching category', async () => {
            const category = { _id: 'category-id', name: 'Office' };
            categoryModel.findById.mockResolvedValue(category);

            await getCategoryById({ params: { id: 'category-id' } }, response);

            expect(categoryModel.findById).toHaveBeenCalledWith('category-id');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: category,
            });
        });

        test('returns not found when the category does not exist', async () => {
            categoryModel.findById.mockResolvedValue(null);

            await getCategoryById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Category not found',
            });
        });
    });

    describe('updateCategoryById', () => {
        test('updates and returns the matching category', async () => {
            const category = { _id: 'category-id', name: 'Stationery' };
            categoryModel.findByIdAndUpdate.mockResolvedValue(category);

            await updateCategoryById(
                {
                    params: { id: 'category-id' },
                    body: { name: 'Stationery' },
                },
                response,
            );

            expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'category-id',
                { name: 'Stationery' },
                { new: true },
            );
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Category updated successfully',
                data: category,
            });
        });

        test('rejects invalid input without updating', async () => {
            await updateCategoryById(
                { params: { id: 'category-id' }, body: {} },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('returns not found when the category does not exist', async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValue(null);

            await updateCategoryById(
                {
                    params: { id: 'missing-id' },
                    body: { name: 'Stationery' },
                },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Category not found',
            });
        });
    });

    describe('deleteCategoryById', () => {
        test('deletes the matching category', async () => {
            categoryModel.findByIdAndDelete.mockResolvedValue({ _id: 'category-id' });

            await deleteCategoryById({ params: { id: 'category-id' } }, response);

            expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith('category-id');
            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Category deleted successfully',
            });
        });

        test('returns not found when the category does not exist', async () => {
            categoryModel.findByIdAndDelete.mockResolvedValue(null);

            await deleteCategoryById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Category not found',
            });
        });
    });
});
