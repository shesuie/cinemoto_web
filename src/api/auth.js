import api from './client';

export const authApi = {
    async login(payload) {
        try {
            const response = await api.post('/api/v1/auth/login', payload);

            return { user: response.data.data };
        } catch (error) {
            if (error.status === 409 && error.errorCode === 'TWO_FACTOR_REQUIRED') {
                return { twoFactor: true };
            }

            throw error;
        }
    },

    async twoFactor(code) {
        const response = await api.post('/api/v1/auth/two-factor', { code });

        return response.data.data;
    },

    async me() {
        const response = await api.get('/api/v1/auth/me');

        return response.data.data;
    },

    async logout() {
        await api.post('/api/v1/auth/logout');
    },

    async resendVerification() {
        const response = await api.post('/api/v1/auth/email/verification-notification');

        return response.data;
    },
};
