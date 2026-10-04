import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/customError.js'

export const isAuthentication = (req, res, next) => {

    // check the header for authorization
    const authHeader = req.headers.authorization;

    const bearer = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies?.token;

    if (!bearer) {
        throw new UnauthorizedError('Unauthorized access');
    }

    let token;

    // verify if the token is valid if not return unauthorized
    try {
        token = jwt.verify(bearer, process.env.JWT_SECRET);
    } catch (error) {
        throw new UnauthorizedError('Unauthorized access');
    }

    // return authenticated userId and role
    req.user = {
        userId: token.id,
        role: token.role,
    };

    next()

}