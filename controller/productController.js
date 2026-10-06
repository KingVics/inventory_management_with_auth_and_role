import { Product as productModel } from "../model/product.js"
import { HttpCodes } from '../utils/statusCode.js'
import { createProductValidation } from '../validator/validations.js';

const { Ok, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, NO_CONTENT, CREATED } = HttpCodes();



// •	GET / api / products / supplier / { supplierId } — Get products by supplier
// •	GET / api / products / low - stock — Get low - stock products


// -- create a product
const createProduct = async (req, res) => {
    try {
        const { value, error } = createProductValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const product = await productModel.create(value)

        res.status(CREATED).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}

// -- get all products
const getAllProducts = async (req, res) => {
    try {
        const { name,
            description,
            sku,
            price,
            quantity,
            minimumStock,
            categoryId,
            supplierId,
            productId } = req.query;
        let query = {}

        if (name) query.name = name
        if (description) query.description = description
        if (sku) query.sku = sku
        if (price) query.price = price
        if (quantity) query.quantity = quantity
        if (minimumStock) query.minimumStock = minimumStock
        if (categoryId) query.categoryId = categoryId
        if (supplierId) query.supplierId = supplierId
        if (productId) query.productId = productId

        const products = await productModel.find(query)

        res.status(Ok).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}

// -- get product by id
const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await productModel.findById(productId)

        if (!product) {
            return res.status(NOT_FOUND).json({ message: 'Product not found' });
        }
        res.status(Ok).json({
            success: true,
            data: product,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}


// -- get all product by their category
const getProductsByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params

        if (!categoryId) {
            return res.status(BAD_REQUEST).json({ message: 'Category Id is missing' });
        }

        const products = await productModel.find(categoryId)

        res.status(Ok).json({
            success: true,
            data: products,
        });

    } catch (error) {

    }
}

const getLowStockProducts = async (req, res) => {
    try {
        const products = await productModel.find({
            $expr: { $lte: ['$quantity', '$minimumStock'] },
        });

        res.status(Ok).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

const getProductsBySupplierId = async (req, res) => {
    try {
        const products = await productModel.find({ supplierId: req.params.supplierId });

        res.status(Ok).json({
            success: true,
            data: products,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

// -- update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params
        const { value, error } = createProductValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const product = await productModel.findByIdAndUpdate(id, value, { new: true })

        if (!product) {
            return res.status(NOT_FOUND).json({ message: 'Product not found' });
        }
        res.status(CREATED).json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    } catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });

    }
}


//--- Delete a product by ID
const deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await productModel.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(NOT_FOUND).json({ message: 'Product not found' });

        }

        res.status(NO_CONTENT).json({
            success: true,
            message: 'Product deleted successfully',
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategoryId,
    getLowStockProducts,
    getProductsBySupplierId,
    updateProduct,
    deleteProductById
}