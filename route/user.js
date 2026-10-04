import express from 'express';
import { getUserById, updateUserById, deleteUserById, getAllUsers, getAuthenticatedUserProfile } from '../controller/userController.js';
const router = express.Router();


router.get('/users/profile', getAuthenticatedUserProfile);
router.route('/users/:id')
    .get(getUserById) // Route to get a user by ID
    .put(updateUserById) // Route to update a user by ID
    .delete(deleteUserById); // Route to delete a user by ID
router.get('/users', getAllUsers); // Route to get all users


export default router;