import { HttpCodes } from '../utils/statusCode.js';

const { Ok } = HttpCodes();
const logout = (req, res, next) => {
    req.logout((logoutError) => {
        if (logoutError) {
            return next(logoutError);
        }

        req.session.destroy((sessionError) => {
            if (sessionError) {
                return next(sessionError);
            }

            res.clearCookie('inventory.sid', { path: '/' });
            res.clearCookie('connect.sid', { path: '/' });
            res.clearCookie('token', { path: '/' });
            return res.status(Ok).json({
                success: true,
                message: 'Logout successful',
            });
        });
    });
};

export { logout };
