import { describe, expect, jest, test } from '@jest/globals';
import { isAuthentication } from './authentication.js';

describe('Passport session authentication middleware', () => {
    test('rejects requests without an authenticated Passport session', () => {
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        isAuthentication(
            { isAuthenticated: () => false },
            response,
            next,
        );

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });

    test('sets the application user from the authenticated GitHub profile', () => {
        const req = {
            isAuthenticated: () => true,
            user: {
                githubId: 'github-id',
                username: 'alexm',
                role: 'user',
            },
        };
        const next = jest.fn();

        isAuthentication(req, {}, next);

        expect(req.user).toEqual({
            userId: 'github-id',
            role: 'user',
            username: 'alexm',
        });
        expect(next).toHaveBeenCalled();
    });

    test('rejects an authenticated request without a profile', () => {
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        isAuthentication(
            { isAuthenticated: () => true },
            response,
            next,
        );

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });
});
