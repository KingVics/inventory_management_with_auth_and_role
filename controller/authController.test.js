import { describe, expect, jest, test } from '@jest/globals';
import { logout } from './authController.js';

describe('auth controller', () => {
    test('destroys the Passport session and clears authentication cookies', () => {
        const response = {
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();
        const req = {
            logout: jest.fn((callback) => callback()),
            session: {
                destroy: jest.fn((callback) => callback()),
            },
        };

        logout(req, response, next);

        expect(req.logout).toHaveBeenCalled();
        expect(req.session.destroy).toHaveBeenCalled();
        expect(response.clearCookie).toHaveBeenCalledWith(
            'inventory.sid',
            { path: '/' },
        );
        expect(response.clearCookie).toHaveBeenCalledWith(
            'connect.sid',
            { path: '/' },
        );
        expect(response.clearCookie).toHaveBeenCalledWith('token', { path: '/' });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
            success: true,
            message: 'Logout successful',
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('passes logout errors to Express error handling', () => {
        const response = {
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const error = new Error('logout failed');
        const next = jest.fn();
        const req = {
            logout: jest.fn((callback) => callback(error)),
            session: {
                destroy: jest.fn(),
            },
        };

        logout(req, response, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(req.session.destroy).not.toHaveBeenCalled();
        expect(response.clearCookie).not.toHaveBeenCalled();
    });

    test('passes session destruction errors to Express error handling', () => {
        const response = {
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const error = new Error('session store unavailable');
        const next = jest.fn();
        const req = {
            logout: jest.fn((callback) => callback()),
            session: {
                destroy: jest.fn((callback) => callback(error)),
            },
        };

        logout(req, response, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(response.clearCookie).not.toHaveBeenCalled();
    });
});
