import { describe, expect, jest, test } from '@jest/globals';
import { getAuthenticationStatus } from './auth.js';

describe('authentication status', () => {
    test('returns the current Passport username when signed in', () => {
        const req = {
            isAuthenticated: jest.fn(() => true),
            user: { username: 'alexm' },
        };

        expect(getAuthenticationStatus(req)).toEqual({
            authenticated: true,
            username: 'alexm',
        });
    });

    test('reports anonymous when no Passport session is authenticated', () => {
        const req = {
            isAuthenticated: jest.fn(() => false),
            user: { username: 'alexm' },
        };

        expect(getAuthenticationStatus(req)).toEqual({
            authenticated: false,
            username: null,
        });
    });

    test('does not report authenticated without a username', () => {
        const req = {
            isAuthenticated: jest.fn(() => true),
            user: {},
        };

        expect(getAuthenticationStatus(req)).toEqual({
            authenticated: false,
            username: null,
        });
    });
});
