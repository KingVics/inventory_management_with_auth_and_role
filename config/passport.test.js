import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const passport = (await import('passport')).default;
const { configurePassport } = await import('./passport.js');

describe('GitHub OAuth strategy', () => {
    beforeEach(() => {
        process.env.GITHUB_CLIENT_ID = 'client-id';
        process.env.GITHUB_CLIENT_SECRET = 'client-secret';
        process.env.GITHUB_CALLBACK_URL =
            'http://localhost:3000/api/v1/auth/github/callback';
        configurePassport();
    });

    test('accepts a GitHub profile without accessing the user model', () => {
        const done = jest.fn();
        const profile = {
            id: 'github-id',
            username: 'alexm',
        };

        passport._strategy('github')._verify(
            'access-token',
            'refresh-token',
            profile,
            done,
        );

        expect(done).toHaveBeenCalledWith(null, {
            githubId: 'github-id',
            username: 'alexm',
            role: 'user',
        });
    });

    test('uses the GitHub display name when no username is available', () => {
        const done = jest.fn();

        passport._strategy('github')._verify(
            'access-token',
            'refresh-token',
            { id: 'github-id', displayName: 'Alex Morgan' },
            done,
        );

        expect(done).toHaveBeenCalledWith(null, {
            githubId: 'github-id',
            username: 'Alex Morgan',
            role: 'user',
        });
    });

    test('stores only the minimal GitHub profile in the Passport session', () => {
        const user = {
            githubId: 'github-id',
            username: 'alexm',
            role: 'user',
            accessToken: 'not-for-session',
        };
        const done = jest.fn();
        const serializer = passport._serializers.at(-1);

        serializer(user, done);

        expect(done).toHaveBeenCalledWith(null, {
            githubId: 'github-id',
            username: 'alexm',
            role: 'user',
        });
    });

    test('restores the GitHub profile from the Passport session', () => {
        const profile = {
            githubId: 'github-id',
            username: 'alexm',
            role: 'user',
        };
        const done = jest.fn();
        const deserializer = passport._deserializers.at(-1);

        deserializer(profile, done);

        expect(done).toHaveBeenCalledWith(null, profile);
    });
});
