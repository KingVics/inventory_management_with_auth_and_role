import express from "express"
import { loginUser, createUser, logout } from "../controller/authController.js"
const router = express.Router();


// Define routes for user-related operations
router.post('/auth/register', createUser); // Route for user registration
router.post('/auth/login', loginUser);
router.post('/auth/logout', logout);

export default router;