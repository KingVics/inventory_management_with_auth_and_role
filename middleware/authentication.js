export const isAuthentication = (req, res, next) => {
    if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
        userId: req.user.githubId,
        role: req.user.role,
        username: req.user.username,
    };
    return next();
};
