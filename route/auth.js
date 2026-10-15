import { randomBytes, timingSafeEqual } from 'node:crypto';
import express from 'express';
import passport from 'passport';
import { logout } from '../controller/authController.js';

const router = express.Router();
const oauthStateCookie = 'github_oauth_state';
const oauthStateCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth/github',
};

export const getAuthenticationStatus = (req) => {
    const authenticated =
        typeof req.isAuthenticated === 'function' &&
        req.isAuthenticated() &&
        typeof req.user?.username === 'string';

    return {
        authenticated,
        username: authenticated ? req.user.username : null,
    };
};

router.get('/auth/status', (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.json(getAuthenticationStatus(req));
});

router.get('/auth/github', (req, res, next) => {
    if (req.get('sec-fetch-mode') === 'cors') {
        return res.status(400).json({
            success: false,
            message:
                'GitHub sign-in must be opened as a browser navigation. Use the "Open GitHub sign-in" link in the API docs instead of Try it out.',
        });
    }

    const state = randomBytes(32).toString('hex');
    res.cookie(oauthStateCookie, state, {
        ...oauthStateCookieOptions,
        maxAge: 10 * 60 * 1000,
    });

    passport.authenticate('github', {
        state,
    })(req, res, next);
});

router.get('/auth/github/callback', (req, res, next) => {
    const expectedState = req.cookies?.[oauthStateCookie];
    const receivedState = req.query.state;
    const statesMatch =
        typeof expectedState === 'string' &&
        typeof receivedState === 'string' &&
        expectedState.length === receivedState.length &&
        timingSafeEqual(Buffer.from(expectedState), Buffer.from(receivedState));

    res.clearCookie(oauthStateCookie, oauthStateCookieOptions);

    if (!statesMatch) {
        return res.status(400).json({
            success: false,
            message: 'Invalid OAuth state. Please start the GitHub sign-in again.',
        });
    }

    passport.authenticate('github', (error, user, info) => {
        if (error) {
            return next(error);
        }

        if (!user) {
            return res.status(info?.status ?? 401).json({
                success: false,
                message: info?.message ?? 'GitHub authentication failed.',
            });
        }

        return req.logIn(user, (loginError) => {
            if (loginError) {
                return next(loginError);
            }

            res.clearCookie('token', { path: '/' });
            return res.redirect('/');
        });
    })(req, res, next);
});

router.post('/auth/logout', logout);

export default router;
