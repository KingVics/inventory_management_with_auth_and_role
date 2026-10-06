import { User as userModel } from '../model/user.js';
import { comparePassword, createToken, hashPassword } from '../utils/hash.js';
import { HttpCodes } from '../utils/statusCode.js'
import { userValidation, LoginSchema } from '../validator/validations.js';


const { Ok, INTERNAL_SERVER_ERROR, CREATED, BAD_REQUEST, UNAUTHORIZED } = HttpCodes();
const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
};


// -- Login user
const loginUser = async (req, res) => {
    try {
        // Validate the request body using the LoginSchema
        const { error, value } = LoginSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        // Destructure the validated values
        const { email, password } = value;

        // Find the user by email in the database
        const user = await userModel.findOne({ email })

        // If the user is not found, return an error response
        if (!user) {
            return res.status(UNAUTHORIZED).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(BAD_REQUEST).json({ message: 'Invalid email or password' });
        }


        // Create a JWT token for the authenticated user
        const accessToken = createToken({ userId: user._id, role: user.role });

        res.cookie('token', accessToken, {
            ...authCookieOptions,
            maxAge: 40 * 60 * 1000,
        });

        res.status(Ok).json({
            "success": true,
            "message": "Login successful",
            "token": accessToken,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                userId: user._id
            }
        });
    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }

}

// --- Create a new user
const createUser = async (req, res) => {
    try {
        // Validate the request body using the userValidation schema
        const { error, value } = userValidation().validate(req.body, { abortEarly: false })

        // If there are validation errors, return a bad request response with the error messages
        if (error) {
            return res.status(BAD_REQUEST).json({ message: error.details.map((err) => err.message) });
        }

        const { firstName, lastName, email, phone, role, password } = value;

        // hash the password before saving it to the database
        const passwordHash = await hashPassword(password);

        // Create a new user instance using the userModel
        const newUser = new userModel({
            firstName,
            lastName,
            email,
            phone,
            role,
            password: passwordHash,
        });

        const savedUser = await newUser.save();
        res.status(CREATED).json({
            success: true,
            data: {
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                phone: savedUser.phone,
                role: savedUser.role,
                userId: savedUser._id
            },
        });

    }
    catch (error) {
        res.status(INTERNAL_SERVER_ERROR).json({ message: error.message });
    }

}

// --- logout authenticated user
const logout = (req, res) => {
    res.clearCookie('token', authCookieOptions);
    return res.status(Ok).json({
        success: true,
        message: 'Logout successful',
    });
}


export { loginUser, createUser, logout };