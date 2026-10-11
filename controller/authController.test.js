import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const userSave = jest.fn();
const userModel = Object.assign(
    jest.fn(function (user) {
        Object.assign(this, user);
        this.save = userSave;
    }),
    { findOne: jest.fn() },
);
const comparePassword = jest.fn();
const createToken = jest.fn();
const hashPassword = jest.fn();

jest.unstable_mockModule('../model/user.js', () => ({
    User: userModel,
}));

jest.unstable_mockModule('../utils/hash.js', () => ({
    comparePassword,
    createToken,
    hashPassword,
}));

const { loginUser, createUser, logout } = await import('./authController.js');

const createResponse = () => {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
};

const validCredentials = {
    email: 'alex@example.com',
    password: 'password123',
};

const validUser = {
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@example.com',
    phone: '5551234567',
    role: 'user',
    password: 'password123',
};

describe('auth controller', () => {
    let response;

    beforeEach(() => {
        response = createResponse();
        userModel.mockClear();
        userModel.findOne.mockReset();
        userSave.mockReset();
        comparePassword.mockReset();
        createToken.mockReset();
        hashPassword.mockReset();
    });

    describe('loginUser', () => {
        test('validates credentials before looking up the user', async () => {
            await loginUser({ body: { email: 'invalid-email' } }, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: expect.arrayContaining([expect.any(String)]),
            });
            expect(userModel.findOne).not.toHaveBeenCalled();
        });

        test('returns unauthorized when the email is not found', async () => {
            userModel.findOne.mockResolvedValue(null);

            await loginUser({ body: validCredentials }, response);

            expect(userModel.findOne).toHaveBeenCalledWith({
                email: 'alex@example.com',
            });
            expect(response.status).toHaveBeenCalledWith(401);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            });
            expect(comparePassword).not.toHaveBeenCalled();
        });

        test('rejects an incorrect password', async () => {
            userModel.findOne.mockResolvedValue({
                _id: 'user-id',
                password: 'stored-hash',
            });
            comparePassword.mockResolvedValue(false);

            await loginUser({ body: validCredentials }, response);

            expect(comparePassword).toHaveBeenCalledWith('password123', 'stored-hash');
            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: 'Invalid email or password',
            });
            expect(createToken).not.toHaveBeenCalled();
        });

        test('sets the authentication cookie and returns the user on success', async () => {
            const user = {
                _id: 'user-id',
                firstName: 'Alex',
                lastName: 'Morgan',
                email: 'alex@example.com',
                phone: '5551234567',
                role: 'user',
                password: 'stored-hash',
            };
            userModel.findOne.mockResolvedValue(user);
            comparePassword.mockResolvedValue(true);
            createToken.mockReturnValue('signed-token');

            await loginUser({ body: validCredentials }, response);

            expect(createToken).toHaveBeenCalledWith({
                userId: 'user-id',
                role: 'user',
            });
            expect(response.cookie).toHaveBeenCalledWith(
                'token',
                'signed-token',
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 40 * 60 * 1000,
                }),
            );
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successful',
                token: 'signed-token',
                user: {
                    firstName: 'Alex',
                    lastName: 'Morgan',
                    email: 'alex@example.com',
                    phone: '5551234567',
                    role: 'user',
                    userId: 'user-id',
                },
            });
        });

        test('returns an internal server error when authentication fails unexpectedly', async () => {
            userModel.findOne.mockRejectedValue(new Error('database unavailable'));

            await loginUser({ body: validCredentials }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('createUser', () => {
        test('hashes the password and returns the saved user without the hash', async () => {
            hashPassword.mockResolvedValue('hashed-password');
            userSave.mockResolvedValue({
                _id: 'user-id',
                ...validUser,
                password: 'hashed-password',
            });

            await createUser({ body: validUser }, response);

            expect(hashPassword).toHaveBeenCalledWith('password123');
            expect(userModel).toHaveBeenCalledWith({
                ...validUser,
                password: 'hashed-password',
            });
            expect(userSave).toHaveBeenCalled();
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    firstName: 'Alex',
                    lastName: 'Morgan',
                    email: 'alex@example.com',
                    phone: '5551234567',
                    role: 'user',
                    userId: 'user-id',
                },
            });
        });

        test('rejects invalid registration data without hashing or saving', async () => {
            await createUser(
                { body: { ...validUser, email: 'invalid-email' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({
                message: expect.arrayContaining([expect.any(String)]),
            });
            expect(hashPassword).not.toHaveBeenCalled();
            expect(userSave).not.toHaveBeenCalled();
        });

        test('returns an internal server error when registration fails', async () => {
            hashPassword.mockResolvedValue('hashed-password');
            userSave.mockRejectedValue(new Error('database unavailable'));

            await createUser({ body: validUser }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('logout', () => {
        test('clears the authentication cookie and confirms logout', () => {
            logout({}, response);

            expect(response.clearCookie).toHaveBeenCalledWith(
                'token',
                expect.objectContaining({
                    httpOnly: true,
                    sameSite: 'strict',
                    path: '/',
                }),
            );
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logout successful',
            });
        });
    });
});
