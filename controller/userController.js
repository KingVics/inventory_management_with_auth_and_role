import { User as userModel } from '../model/user.js';
import { HttpCodes } from '../utils/statusCode.js'
import { userUpdateValidation } from '../validator/validations.js';

const { Ok, INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, NO_CONTENT } = HttpCodes();


//--- Get a user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id).select('-password'); // Exclude the password field from the result

        if (!user) {
            return res.status(NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(Ok).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//-- Get all users
const getAllUsers = async (req, res) => {
    try {
        // Extract query parameters from the request
        const { firstName, lastName, userId, email, phone } = req.query;
        let query = {};
        if (firstName) query.firstName = firstName;
        if (lastName) query.lastName = lastName;
        if (userId) query.userId = userId;
        if (email) query.email = email;
        if (phone) query.phone = phone;
        // Find users based on the constructed query
        const users = await userModel.find(query).select('-password'); // Exclude the password field from the results
        // Return the found users in the response
        res.status(Ok).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//--- Update a user by ID
const updateUserById = async (req, res) => {
    try {
        const id = req.user.userId
        const { error, value } = userUpdateValidation().validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const updatedUser = await userModel.findByIdAndUpdate(id, value, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(Ok).json({
            success: true,
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//--- Delete a user by ID
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await userModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(NO_CONTENT).json({
            success: true,
            message: 'User deleted successfully',
        });
    }

    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

//- Get the authenticated user's profile
const getAuthenticatedUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(Ok).json({
            success: true,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                userId: user._id
            },
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export { getUserById, updateUserById, deleteUserById, getAllUsers, getAuthenticatedUserProfile };