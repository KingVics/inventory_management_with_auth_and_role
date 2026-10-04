import { Supplier as supplierModel } from '../model/supplier.js'
import { HttpCodes } from '../utils/statusCode.js'
import { createSupplierValidation } from '../validator/validations.js';

const { Ok, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, NO_CONTENT, CREATED } = HttpCodes();


// -- Create Supplier
const createSupplier = async (req, res) => {
    try {
        const { error, value } = createSupplierValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const { name, address, email, phone, contactPerson } = value

        const supplier = await supplierModel.create({
            name,
            address,
            email,
            phone,
            contactPerson
        })

        res.status(CREATED).json({
            success: true,
            message: 'Supplier created successfully',
            data: supplier,
        });

    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}

//-- Get all supplier
const getAllSuppliers = async (req, res) => {
    try {
        const { name, email, contactPerson, phone, supplierId } = req.query;
        let query = {};
        if (name) query.name = name;
        if (email) query.email = email;
        if (phone) query.phone = phone;
        if (contactPerson) query.contactPerson = contactPerson;
        if (supplierId) query._id = supplierId;
        const supplier = await supplierModel.find(query);
        res.status(Ok).json({
            success: true,
            data: supplier,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//--- Get a supplier by ID
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await supplierModel.findById(id)

        if (!supplier) {
            return res.status(NOT_FOUND).json({ message: 'Supplier not found' });
        }

        res.status(Ok).json({
            success: true,
            data: supplier,
        })

    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}

//--- Update a supplier by ID
const updateSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = createSupplierValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const supplier = await supplierModel.findByIdAndUpdate(id, value, { new: true });

        if (!supplier) {
            return res.status(NOT_FOUND).json({ message: 'Supplier not found' });
        }

        res.status(Ok).json({
            success: true,
            message: 'Supplier updated successfully',
            data: supplier,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}


//--- Delete a supplier by ID
const deleteSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedSupplier = await supplierModel.findByIdAndDelete(id);

        if (!deletedSupplier) {
            return res.status(NOT_FOUND).json({ message: 'Supplier not found' });

        }

        res.status(NO_CONTENT).json({
            success: true,
            message: 'Supplier deleted successfully',
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export { updateSupplierById, deleteSupplierById, getAllSuppliers, createSupplier, getSupplierById }