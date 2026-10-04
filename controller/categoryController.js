import { Category as categoryModel } from '../model/category.js';
import { HttpCodes } from '../utils/statusCode.js';
import { categoryValidation } from '../validator/validations.js';

const { Ok, INTERNAL_SERVER_ERROR, CREATED, BAD_REQUEST, NOT_FOUND, NO_CONTENT } = HttpCodes();


//--- Create a new category
const createCategory = async (req, res) => {
    try {
        // Validate the request body using the categoryValidation schema
        const { error, value } = categoryValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const { name, description } = value;

        // save the new category to the database
        const data = await categoryModel.create({ name, description });

        res.status(CREATED).json({
            success: true,
            message: 'Category created successfully',
            data: data,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//-- Get all categories
const getAllCategories = async (req, res) => {
    try {
        const { name, description } = req.query;
        let query = {};
        if (name) query.name = name;
        if (description) query.description = description;
        const categories = await categoryModel.find(query);
        res.status(Ok).json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}


//--- Get a category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await categoryModel.findById(id);

        if (!category) {
            return res.status(NOT_FOUND).json({ message: 'Category not found' });
        }

        res.status(Ok).json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//--- Update a category by ID
const updateCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = categoryValidation.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const updatedCategory = await categoryModel.findByIdAndUpdate(id, value, { new: true });

        if (!updatedCategory) {
            return res.status(NOT_FOUND).json({ message: 'Category not found' });
        }

        res.status(Ok).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}


//--- Delete a category by ID
const deleteCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCategory = await categoryModel.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(NOT_FOUND).json({ message: 'Category not found' });

        }

        res.status(NO_CONTENT).json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export { createCategory, getAllCategories, getCategoryById, updateCategoryById, deleteCategoryById };