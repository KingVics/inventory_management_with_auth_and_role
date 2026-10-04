import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

export const comparePassword = async (password, hashedPassword) => {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}

export const createToken = ({ userId, role }) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    console.log('Creating token for userId:', userId, 'with role:', role); // Log the userId and role for debugging
    return jwt.sign({ id: userId.toString(), role }, process.env.JWT_SECRET, {
        expiresIn: '40m',
    });
}