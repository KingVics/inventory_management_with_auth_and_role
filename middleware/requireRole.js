

// check to see if the authenticated user have the necessary authorization
export const requireRole = (role) => {
    return (req, res, next) => {
        try {
            const user = req.user

            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const userRole = user.role;

            if (!userRole) {
                return res.status(403).json({ message: 'Role not found on user' });
            }

            if (Array.isArray(role)) {
                if (!role.includes(userRole)) {
                    return res.status(403).json({ message: 'Insufficient role' });
                }
            } else {
                if (role !== userRole) {
                    return res.status(403).json({ message: 'Insufficient role' });
                }
            }
            return next();
        }
        catch (error) {
            return res.status(500).json({ error: 'Server error' });
        }

    }

}