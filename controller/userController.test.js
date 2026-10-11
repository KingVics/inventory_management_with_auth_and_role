import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const selectMock = jest.fn();
const userModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

jest.unstable_mockModule('../model/user.js', () => ({
    User: userModel,
}));

const {
    getUserById,
    updateUserById,
    deleteUserById,
    getAllUsers,
    getAuthenticatedUserProfile,
} = await import('./userController.js');

const createResponse = () => {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    return response;
};

const validUserUpdate = {
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@example.com',
    phone: '5551234567',
    role: 'user',
};

describe('user controller', () => {
    let response;

    beforeEach(() => {
        response = createResponse();
        selectMock.mockReset();
        userModel.find.mockReset();
        userModel.findById.mockReset();
        userModel.findByIdAndUpdate.mockReset();
        userModel.findByIdAndDelete.mockReset();
    });

    describe('getUserById', () => {
        test('returns the user without the password field', async () => {
            const user = { _id: 'user-id', firstName: 'Alex' };
            selectMock.mockResolvedValue(user);
            userModel.findById.mockReturnValue({ select: selectMock });

            await getUserById({ params: { id: 'user-id' } }, response);

            expect(userModel.findById).toHaveBeenCalledWith('user-id');
            expect(selectMock).toHaveBeenCalledWith('-password');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        test('returns not found when the user does not exist', async () => {
            selectMock.mockResolvedValue(null);
            userModel.findById.mockReturnValue({ select: selectMock });

            await getUserById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        test('returns an internal server error when lookup fails', async () => {
            userModel.findById.mockImplementation(() => {
                throw new Error('database unavailable');
            });

            await getUserById({ params: { id: 'user-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('getAllUsers', () => {
        test('filters users and excludes their passwords', async () => {
            const users = [{ _id: 'user-id', firstName: 'Alex' }];
            selectMock.mockResolvedValue(users);
            userModel.find.mockReturnValue({ select: selectMock });

            await getAllUsers(
                {
                    query: {
                        firstName: 'Alex',
                        lastName: 'Morgan',
                        userId: 'user-id',
                        email: 'alex@example.com',
                        phone: '5551234567',
                    },
                },
                response,
            );

            expect(userModel.find).toHaveBeenCalledWith({
                firstName: 'Alex',
                lastName: 'Morgan',
                userId: 'user-id',
                email: 'alex@example.com',
                phone: '5551234567',
            });
            expect(selectMock).toHaveBeenCalledWith('-password');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: users });
        });

        test('returns an internal server error when lookup fails', async () => {
            userModel.find.mockImplementation(() => {
                throw new Error('database unavailable');
            });

            await getAllUsers({ query: {} }, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({
                message: 'database unavailable',
            });
        });
    });

    describe('updateUserById', () => {
        test('updates the authenticated user and excludes the password', async () => {
            const user = { _id: 'user-id', ...validUserUpdate };
            selectMock.mockResolvedValue(user);
            userModel.findByIdAndUpdate.mockReturnValue({ select: selectMock });

            await updateUserById(
                { user: { userId: 'user-id' }, body: validUserUpdate },
                response,
            );

            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user-id',
                validUserUpdate,
                { new: true },
            );
            expect(selectMock).toHaveBeenCalledWith('-password');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        test('rejects invalid input without updating the user', async () => {
            await updateUserById(
                {
                    user: { userId: 'user-id' },
                    body: { ...validUserUpdate, email: 'not-an-email' },
                },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(400);
            expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('returns not found when the authenticated user does not exist', async () => {
            selectMock.mockResolvedValue(null);
            userModel.findByIdAndUpdate.mockReturnValue({ select: selectMock });

            await updateUserById(
                { user: { userId: 'missing-id' }, body: validUserUpdate },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('deleteUserById', () => {
        test('deletes the requested user', async () => {
            userModel.findByIdAndDelete.mockResolvedValue({ _id: 'user-id' });

            await deleteUserById({ params: { id: 'user-id' } }, response);

            expect(userModel.findByIdAndDelete).toHaveBeenCalledWith('user-id');
            expect(response.status).toHaveBeenCalledWith(204);
            expect(response.json).toHaveBeenCalledWith({
                success: true,
                message: 'User deleted successfully',
            });
        });

        test('returns not found when the user does not exist', async () => {
            userModel.findByIdAndDelete.mockResolvedValue(null);

            await deleteUserById({ params: { id: 'missing-id' } }, response);

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });

    describe('getAuthenticatedUserProfile', () => {
        test('returns the authenticated user profile without the password', async () => {
            const user = {
                _id: 'user-id',
                firstName: 'Alex',
                lastName: 'Morgan',
                email: 'alex@example.com',
                phone: '5551234567',
                role: 'user',
                password: 'secret-hash',
            };
            selectMock.mockResolvedValue(user);
            userModel.findById.mockReturnValue({ select: selectMock });

            await getAuthenticatedUserProfile(
                { user: { userId: 'user-id' } },
                response,
            );

            expect(userModel.findById).toHaveBeenCalledWith('user-id');
            expect(selectMock).toHaveBeenCalledWith('-password');
            expect(response.status).toHaveBeenCalledWith(200);
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

        test('returns not found when the authenticated user does not exist', async () => {
            selectMock.mockResolvedValue(null);
            userModel.findById.mockReturnValue({ select: selectMock });

            await getAuthenticatedUserProfile(
                { user: { userId: 'missing-id' } },
                response,
            );

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ message: 'User not found' });
        });
    });
});
