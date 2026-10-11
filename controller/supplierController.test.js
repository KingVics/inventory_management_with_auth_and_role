import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const supplierModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../model/supplier.js', () => ({
    Supplier: supplierModel,
}));

const {
    updateSupplierById,
    deleteSupplierById,
    getAllSuppliers,
    createSupplier,
    getSupplierById,
} = await import('./supplierController.js');

const createResponse = () => {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
};

const validSupplier = {
    name: 'Acme Supply',
    email: 'contact@acme.com',
    phone: '5551234567',
    address: '123 Main Street',
    contactPerson: 'Taylor',
};

describe('supplier controller', () => {
    let response;

    beforeEach(() => {
        response = createResponse();
        supplierModel.create.mockReset();
        supplierModel.find.mockReset();
        supplierModel.findById.mockReset();
        supplierModel.findByIdAndUpdate.mockReset();
        supplierModel.findByIdAndDelete.mockReset();
    });

    describe('createSupplier', () => {
        test('creates a supplier from valid input', async () => {
            const supplier = { _id: 'supplier-id', ...validSupplier };
            supplierModel.create.mockResolvedValue(supplier);

            await createSupplier({ body: validSupplier }, response);

            expect(supplierModel.create).toHaveBeenCalledWith(validSupplier);
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Supplier created successfully',
                data: supplier,
            });
        });

        test('rejects invalid input without creating a supplier', async () => {
            await createSupplier(
                { body: { ...validSupplier, phone: 'phone-too-long' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: expect.arrayContaining([expect.any(String)]),
            });
            expect(supplierModel.create).not.toHaveBeenCalled();
        });

        test('returns an internal server error when creation fails', async () => {
            supplierModel.create.mockRejectedValue(new Error('database unavailable'));

            await createSupplier({ body: validSupplier }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getAllSuppliers', () => {
        test('filters suppliers by supplied query parameters', async () => {
            const suppliers = [{ _id: 'supplier-id', ...validSupplier }];
            supplierModel.find.mockResolvedValue(suppliers);

            await getAllSuppliers(
                {
                    query: {
                        name: 'Acme Supply',
                        email: 'contact@acme.com',
                        phone: '5551234567',
                        contactPerson: 'Taylor',
                        supplierId: 'supplier-id',
                    },
                },
                response,
            );

            expect(supplierModel.find).toHaveBeenCalledWith({
                name: 'Acme Supply',
                email: 'contact@acme.com',
                phone: '5551234567',
                contactPerson: 'Taylor',
                _id: 'supplier-id',
            });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: suppliers,
            });
        });

        test('returns an internal server error when lookup fails', async () => {
            supplierModel.find.mockRejectedValue(new Error('database unavailable'));

            await getAllSuppliers({ query: {} }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getSupplierById', () => {
        test('returns the matching supplier', async () => {
            const supplier = { _id: 'supplier-id', ...validSupplier };
            supplierModel.findById.mockResolvedValue(supplier);

            await getSupplierById({ params: { id: 'supplier-id' } }, response);

            expect(supplierModel.findById).toHaveBeenCalledWith('supplier-id');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: supplier,
            });
        });

        test('returns not found when the supplier does not exist', async () => {
            supplierModel.findById.mockResolvedValue(null);

            await getSupplierById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Supplier not found',
            });
        });
    });

    describe('updateSupplierById', () => {
        test('updates and returns the matching supplier', async () => {
            const supplier = { _id: 'supplier-id', ...validSupplier };
            supplierModel.findByIdAndUpdate.mockResolvedValue(supplier);

            await updateSupplierById(
                { params: { id: 'supplier-id' }, body: validSupplier },
                response,
            );

            expect(supplierModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'supplier-id',
                validSupplier,
                { new: true },
            );
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Supplier updated successfully',
                data: supplier,
            });
        });

        test('rejects invalid input without updating the supplier', async () => {
            await updateSupplierById(
                {
                    params: { id: 'supplier-id' },
                    body: { ...validSupplier, email: 'invalid-email' },
                },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(supplierModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('returns not found when the supplier does not exist', async () => {
            supplierModel.findByIdAndUpdate.mockResolvedValue(null);

            await updateSupplierById(
                { params: { id: 'missing-id' }, body: validSupplier },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Supplier not found',
            });
        });
    });

    describe('deleteSupplierById', () => {
        test('deletes the matching supplier', async () => {
            supplierModel.findByIdAndDelete.mockResolvedValue({ _id: 'supplier-id' });

            await deleteSupplierById({ params: { id: 'supplier-id' } }, response);

            expect(supplierModel.findByIdAndDelete).toHaveBeenCalledWith('supplier-id');
            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Supplier deleted successfully',
            });
        });

        test('returns not found when the supplier does not exist', async () => {
            supplierModel.findByIdAndDelete.mockResolvedValue(null);

            await deleteSupplierById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Supplier not found',
            });
        });
    });
});
